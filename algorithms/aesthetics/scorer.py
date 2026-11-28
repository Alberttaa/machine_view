"""Adapt aesthetic model predictions to the shared candidate scoring format."""

from math import isfinite

from .model_loader import load_aesthetic_model


def score_candidates(candidates, config=None):
    """Score valid candidates and return them in descending aesthetic order.

    Each input candidate supplies a `candidate_id` and an `image_path`.
    Defaults to the local LAION predictor. An optional `config["predict"]`
    callable receives an image path and returns an `overall` score plus any
    other model dimensions, all in [0, 1].
    """
    if not candidates:
        return []

    config = {} if config is None else config
    predict = config["predict"] if "predict" in config else load_aesthetic_model()
    if not callable(predict):
        raise ValueError('Aesthetic scoring requires a callable config["predict"]')

    results = []
    for candidate in candidates:
        candidate_id = candidate["candidate_id"]
        scores = dict(predict(candidate["image_path"]))
        if "overall" not in scores:
            raise ValueError(f"Candidate {candidate_id!r} has no overall aesthetic score")

        for dimension, score in scores.items():
            if not isfinite(score) or not 0 <= score <= 1:
                raise ValueError(
                    f"Candidate {candidate_id!r}: {dimension!r} must be in [0, 1]"
                )
            scores[dimension] = float(score)

        results.append({
            "candidate_id": candidate_id,
            "aesthetic_scores": scores,
            "total_score": scores["overall"],
        })

    # Python's stable sort keeps the original candidate order for tied scores.
    results.sort(key=lambda result: result["total_score"], reverse=True)
    for rank, result in enumerate(results, start=1):
        result["rank"] = rank

    return results
