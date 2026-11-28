"""Rerank the leading candidates using pairwise evidence."""

from collections import Counter
from itertools import combinations
from math import isclose, isfinite
from operator import itemgetter
from statistics import fmean


def compare_candidates(candidates, user_preferences=None, config=None):
    """Return all candidates in preference order, preserving their B1 ranks.

    Compare at most `config["top_k"]` candidates (default 5). An optional
    `config["pairwise_predict"](left, right)` provides a signed margin in
    [-1, 1], positive for left. Otherwise use total scores and shared
    aesthetic dimensions as the general evidence.

    Feedback can be a list of records, one record, or a dict with `records`.
    Pass only feedback for the current set of image IDs. If records carry
    task IDs, set `config["task_id"]` to select the relevant task. A record
    without task_id is treated as already scoped by the caller.
    """
    config = {} if config is None else config
    top_k = config.get("top_k", 5)
    if type(top_k) is not int or not 2 <= top_k <= 10:
        raise ValueError("top_k must be an integer between 2 and 10")
    predict = config.get("pairwise_predict", _aesthetic_margin)
    if not callable(predict):
        raise ValueError("pairwise_predict must be callable")

    ordered = sorted(candidates, key=itemgetter("total_score"), reverse=True)
    pool = ordered[:top_k]
    points = Counter()
    if len(pool) > 1:
        candidate_votes, image_votes = _feedback_votes(user_preferences, config.get("task_id"))
        for left, right in combinations(pool, 2):
            left_id, right_id = left["candidate_id"], right["candidate_id"]
            margin = predict(left, right)
            if not isfinite(margin) or not -1 <= margin <= 1:
                raise ValueError("pairwise predictor margins must be finite and in [-1, 1]")
            left_image, right_image = left.get("source_image_id"), right.get("source_image_id")
            left_votes = candidate_votes[left_id, right_id] + image_votes[left_image, right_image]
            right_votes = candidate_votes[right_id, left_id] + image_votes[right_image, left_image]
            # Shrink the feedback effect when only a few comparisons are available.
            margin += 0.1 * (left_votes - right_votes) / (left_votes + right_votes + 4)
            if isclose(margin, 0, abs_tol=1e-12):
                points[left_id] += 0.5
                points[right_id] += 0.5
            else:
                points[left_id if margin > 0 else right_id] += 1

        pool.sort(key=lambda candidate: points[candidate["candidate_id"]], reverse=True)

    opponents = len(pool) - 1
    results = []
    for rank, candidate in enumerate(pool + ordered[top_k:], start=1):
        in_preference = opponents > 0 and rank <= len(pool)
        results.append({
            **candidate,
            "in_preference": in_preference,
            "preference_rank": rank,
            "preference_score": points[candidate["candidate_id"]] / opponents if in_preference else None,
        })
    return results


def _aesthetic_margin(left, right):
    total_margin = left["total_score"] - right["total_score"]
    left_scores = left.get("aesthetic_scores", {})
    right_scores = right.get("aesthetic_scores", {})
    dimensions = (left_scores.keys() & right_scores.keys()) - {"overall"}
    if not dimensions:
        return total_margin
    dimension_margin = fmean(left_scores[key] - right_scores[key] for key in sorted(dimensions))
    return fmean((total_margin, dimension_margin))


def _feedback_votes(user_preferences, task_id):
    records = user_preferences or []
    if isinstance(records, dict):
        records = records.get("records", [records])

    candidate_votes, image_votes = Counter(), Counter()
    for record in records:
        if record.get("task_id") is not None and record["task_id"] != task_id:
            continue
        if record.get("feedback_type") not in {"override", "manual_select"}:
            continue
        # The interface sheet uses source image IDs. The frontend uses candidate IDs.
        if "selected_image_id" in record:
            selected = record["selected_image_id"]
            recommended = record.get("recommended_image_id")
            votes = image_votes
        else:
            selected = record.get("selected_id")
            recommended = record.get("recommended_id")
            votes = candidate_votes
        if selected and recommended and selected != recommended:
            votes[selected, recommended] += 1
    return candidate_votes, image_votes
