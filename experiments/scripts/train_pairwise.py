"""Train and evaluate a B3 preference head on Princeton–Adobe Photo Triage."""

import argparse
from collections import defaultdict
import json
from pathlib import Path
from random import Random
from time import perf_counter

from algorithms.aesthetics.model_loader import load_aesthetic_model
from algorithms.confidence.evaluator import DEFAULT_CONFIDENCE_THRESHOLD
from algorithms.preference.pairwise_model import fit_pairwise_head, signed_margin
from experiments.evaluation.selection import evaluate_groups


def read_pairs(path):
    groups = defaultdict(list)
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        if line.strip():
            group, left, right, ratio, left_rank, right_rank = line.split()
            groups[int(group)].append((int(left), int(right), float(ratio), int(left_rank), int(right_rank)))
    return groups


def image_ids(group, pairs):
    return {(group, image) for left, right, *_ in pairs for image in (left, right)}


def make_groups(groups):
    for group, pairs in groups.items():
        first = {image for left, right, _, rank_left, rank_right in pairs
                 for image, rank in ((left, rank_left), (right, rank_right)) if rank == 1}
        candidates = [
            {"candidate_id": str(image), "source_image_id": str(image), "image_path": (group, image)}
            for _, image in sorted(image_ids(group, pairs))
        ]
        yield {
            "group_id": str(group),
            "best_image_ids": [str(image) for image in sorted(first)],
            "candidates": candidates,
            "quality_results": [
                {"candidate_id": candidate["candidate_id"], "is_valid": True}
                for candidate in candidates
            ],
        }


def encode_images(directory, groups, encoder, batch_size):
    import torch

    wanted = sorted({key for group, pairs in groups.items() for key in image_ids(group, pairs)})
    files = {path.name.lower(): path for path in directory.rglob("*") if path.is_file()}
    paths = [files[f"{group:06d}-{image:02d}.jpg"] for group, image in wanted]
    batches = []
    for start in range(0, len(paths), batch_size):
        batches.append(encoder.encode(paths[start:start + batch_size]))
        if len(batches) % 20 == 0:
            print(f"Encoded {min(start + batch_size, len(paths))}/{len(paths)} images", flush=True)
    return wanted, torch.cat(batches)


def pair_tensors(groups, index, features):
    import torch

    pairs = [(index[group, left], index[group, right], ratio)
             for group, rows in groups.items() for left, right, ratio, *_ in rows]
    left, right, ratios = zip(*pairs)
    return features[list(left)] - features[list(right)], torch.tensor(ratios)


def evaluate(groups, aesthetic_scores, utilities, threshold):
    def compare(left, right):
        return signed_margin(utilities[left["image_path"]], utilities[right["image_path"]])

    return evaluate_groups(list(make_groups(groups)), {
        "predict": lambda key: {"overall": aesthetic_scores[key]},
        "pairwise_predict": compare,
        "confidence_threshold": threshold,
    })


def majority_accuracy(logits, ratios):
    selected = ratios != 0.5
    if not selected.any():
        return None
    return ((logits[selected] > 0) == (ratios[selected] > 0.5)).float().mean().item()


def main():
    import torch

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--train-groups", type=int, default=300)
    parser.add_argument("--development-groups", type=int, default=60)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--threads", type=int, default=4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--checkpoint", type=Path, default=Path("models/checkpoints/phototriage_pairwise.json"))
    parser.add_argument("--report", type=Path, default=Path("experiments/results/phototriage_pairwise.json"))
    args = parser.parse_args()
    if min(args.train_groups, args.development_groups, args.batch_size, args.threads) < 1:
        parser.error("group, batch and thread counts must be positive")
    if args.checkpoint.resolve() == args.report.resolve():
        parser.error("--checkpoint and --report require different paths")
    torch.set_num_threads(args.threads)

    data = args.archive / "train_val"
    training_pool = read_pairs(data / "train_pairlist.txt")
    validation = read_pairs(data / "val_pairlist.txt")
    if training_pool.keys() & validation.keys():
        parser.error("training and validation group IDs overlap")
    sample_count = args.train_groups + args.development_groups
    if sample_count > len(training_pool):
        parser.error(f"at most {len(training_pool)} training and development groups are available")
    chosen = Random(args.seed).sample(sorted(training_pool), sample_count)
    training = {group: training_pool[group] for group in chosen[:args.train_groups]}
    development = {group: training_pool[group] for group in chosen[args.train_groups:]}

    started = perf_counter()
    encoder = load_aesthetic_model()
    keys, features = encode_images(
        data / "train_val_imgs", training | development | validation, encoder, args.batch_size,
    )
    encoded = perf_counter()
    index = {key: row for row, key in enumerate(keys)}
    train_diff, train_targets = pair_tensors(training, index, features)
    weights = fit_pairwise_head(train_diff, train_targets)
    fitted = perf_counter()
    scores = dict(zip(keys, encoder.score_embeddings(features).tolist()))
    utilities = dict(zip(keys, (features @ weights).tolist()))

    thresholds = (0.01, 0.025, DEFAULT_CONFIDENCE_THRESHOLD, 0.10)
    sweep = {}
    for threshold in thresholds:
        sweep[threshold] = evaluate(development, scores, utilities, threshold)["summary"]["hybrid"]
    threshold = max(thresholds, key=lambda value: sweep[value]["agreement_rate"])
    report = evaluate(validation, scores, utilities, threshold)
    default = evaluate(validation, scores, utilities, DEFAULT_CONFIDENCE_THRESHOLD)
    val_diff, val_targets = pair_tensors(validation, index, features)
    report.update({
        "evaluation_scope": "Official validation, original images, no quality filtering; timing uses cached features.",
        "seed": args.seed,
        "training_group_ids": sorted(training),
        "development_group_ids": sorted(development),
        "training_pairs": len(train_targets),
        "validation_pairs": len(val_targets),
        "validation_pairwise_accuracy": majority_accuracy(val_diff @ weights, val_targets),
        "validation_laion_pairwise_accuracy": majority_accuracy(
            torch.tensor([scores[group, left] - scores[group, right]
                          for group, rows in validation.items() for left, right, *_ in rows]),
            val_targets,
        ),
        "confidence_threshold": threshold,
        "development_threshold_sweep": sweep,
        "validation_default_threshold_hybrid": default["summary"]["hybrid"],
        "model_load_and_encoding_seconds": encoded - started,
        "head_fit_seconds": fitted - encoded,
        "encoded_images": len(keys),
    })
    checkpoint = {"encoder": "CLIP ViT-B/32", "weights": weights.tolist(), "confidence_threshold": threshold}
    for path, document in ((args.checkpoint, checkpoint), (args.report, report)):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k not in {
        "groups", "training_group_ids", "development_group_ids", "development_threshold_sweep",
    }}, indent=2))


if __name__ == "__main__":
    main()
