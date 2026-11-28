"""Run the LAION scoring baseline on local candidate images."""

import argparse
import json
from pathlib import Path
from time import perf_counter

from algorithms.aesthetics.model_loader import load_aesthetic_model
from algorithms.aesthetics.scorer import score_candidates


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("images", nargs="+", type=Path)
    args = parser.parse_args()

    for image in args.images:
        if not image.is_file():
            parser.error(f"image file not found: {image}")

    candidates = [
        {"candidate_id": str(image), "image_path": image}
        for image in args.images
    ]

    start = perf_counter()
    load_aesthetic_model()
    loaded = perf_counter()
    rankings = score_candidates(candidates)
    finished = perf_counter()

    print(json.dumps({
        "model_load_seconds": round(loaded - start, 3),
        "scoring_seconds": round(finished - loaded, 3),
        "rankings": rankings,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
