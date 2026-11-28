"""Run the B-group selection pipeline on candidates screened by A."""

from time import perf_counter

from .aesthetics.scorer import score_candidates
from .confidence.evaluator import evaluate_confidence
from .preference.comparator import compare_candidates


def run_selection(candidates, quality_results, user_preferences=None, config=None):
    """Return the ranked candidates and recommendation for one task.

    Every candidate must have a matching quality record with a boolean
    `is_valid`. Configuration keys are forwarded to B1, B2, and B3.
    `selection_mode` defaults to `hybrid`; `aesthetic_only` stops after B1.
    The output `rank` is the final rank. `aesthetic_rank` preserves the B1
    rank, and rejected candidates are returned last without ranks.
    """
    started = perf_counter()
    config = {} if config is None else config
    mode = config.get("selection_mode", "hybrid")
    if mode not in ("hybrid", "aesthetic_only"):
        raise ValueError(f"Unknown selection_mode: {mode!r}")
    quality_by_id = {item["candidate_id"]: item for item in quality_results}
    if len(quality_by_id) != len(quality_results):
        raise ValueError("Duplicate candidate IDs in quality_results")

    valid_by_id = {}
    rejected = []
    seen_ids = set()
    for candidate in candidates:
        candidate_id = candidate["candidate_id"]
        if candidate_id in seen_ids:
            raise ValueError(f"Duplicate candidate ID: {candidate_id!r}")
        seen_ids.add(candidate_id)

        quality = quality_by_id.get(candidate_id)
        if quality is None or not isinstance(quality.get("is_valid"), bool):
            raise ValueError(f"Candidate {candidate_id!r} requires a boolean quality result")

        is_valid = quality["is_valid"]
        checked = {
            **candidate,
            "is_valid": is_valid,
            "quality_status": "passed" if is_valid else "rejected",
            "defects": quality.get("defects", []),
            "quality_scores": quality.get("quality_scores", {}),
        }
        if is_valid:
            valid_by_id[candidate_id] = checked
        else:
            rejected.append(checked)

    if not valid_by_id:
        return {
            "status": "all_poor",
            "best_image_id": None,
            "best_candidate_id": None,
            "preference_triggered": False,
            "confidence": None,
            "processing_time": perf_counter() - started,
            "candidates": rejected,
            "explanation": None,
            "message": "本组照片均存在较明显质量问题，暂无推荐结果。"
            if rejected else "本组没有候选照片，暂无推荐结果。",
        }

    scores = score_candidates(list(valid_by_id.values()), config)
    ranked = [{**valid_by_id[score["candidate_id"]], **score} for score in scores]
    confidence = None
    preference_triggered = False
    if mode == "hybrid":
        decision = evaluate_confidence(ranked, config)
        confidence = decision["confidence"]
        preference_triggered = not decision["is_confident"]
    if preference_triggered:
        ranked = compare_candidates(ranked, user_preferences, config)
        explanation = "美学排序的置信度低于阈值，经过偏好比较后推荐该候选。"
    elif len(ranked) == 1:
        explanation = "该候选是本组唯一通过质量筛查的照片。"
    else:
        explanation = "该候选在通过质量筛查的照片中美学评分最高。"

    for rank, candidate in enumerate(ranked, start=1):
        candidate["aesthetic_rank"] = candidate["rank"]
        candidate["rank"] = rank

    best = ranked[0]
    return {
        "status": "completed",
        "best_image_id": best["source_image_id"],
        "best_candidate_id": best["candidate_id"],
        "preference_triggered": preference_triggered,
        "confidence": confidence,
        "processing_time": perf_counter() - started,
        "candidates": ranked + rejected,
        "explanation": explanation,
    }
