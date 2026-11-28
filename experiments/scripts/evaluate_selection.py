"""Compare aesthetic-only and hybrid selection on an annotated JSON manifest."""

import argparse
import json
from pathlib import Path
from time import perf_counter

from algorithms.aesthetics.model_loader import load_aesthetic_model
from algorithms.confidence.evaluator import DEFAULT_CONFIDENCE_THRESHOLD
from experiments.evaluation.selection import evaluate_groups


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--output", type=Path, help="Save the JSON report to this path")
    parser.add_argument("--confidence-threshold", type=float, default=DEFAULT_CONFIDENCE_THRESHOLD)
    args = parser.parse_args()
    if not 0 < args.confidence_threshold <= 1:
        parser.error("--confidence-threshold must be in (0, 1]")
    if args.output and args.output.resolve() == args.manifest.resolve():
        parser.error("--output must differ from the input manifest")

    try:
        manifest = args.manifest.resolve()
        groups = json.loads(manifest.read_text(encoding="utf-8-sig"))["groups"]
        warmup_image = None
        for group in groups:
            valid_ids = {
                quality["candidate_id"] for quality in group["quality_results"]
                if quality["is_valid"] is True
            }
            for candidate in group["candidates"]:
                candidate["image_path"] = str(manifest.parent / candidate["image_path"])
                if warmup_image is None and candidate["candidate_id"] in valid_ids:
                    warmup_image = candidate["image_path"]

        started = perf_counter()
        if warmup_image is not None:
            load_aesthetic_model()(warmup_image)
        warmup_seconds = perf_counter() - started if warmup_image is not None else 0.0
        report = evaluate_groups(groups, {"confidence_threshold": args.confidence_threshold})
        report["confidence_threshold"] = args.confidence_threshold
        report["model_load_and_warmup_seconds"] = warmup_seconds
        payload = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
        if args.output is None:
            print(payload, end="")
        else:
            args.output.write_text(payload, encoding="utf-8")
    except (KeyError, OSError, TypeError, ValueError) as error:
        parser.error(str(error))


if __name__ == "__main__":
    main()
