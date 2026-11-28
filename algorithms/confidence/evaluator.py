"""Decide whether aesthetic scores provide enough separation for selection."""

from heapq import nlargest
from math import isclose
from operator import itemgetter


DEFAULT_CONFIDENCE_THRESHOLD = 0.05


def evaluate_confidence(scored_candidates, config=None):
    """Return the confidence margin, decision, and reason for B1 scores.

    The margin is the top-two total score gap minus the runner-up's largest
    lead on a shared dimension, floored at zero. The aggregate `overall`
    score is excluded from the dimension comparison. When only aggregate
    scores are available, the margin is the total score gap.

    `config["confidence_threshold"]` sets the minimum margin in (0, 1].
    Confidence is a heuristic decision margin on the B1 score scale.
    """
    config = {} if config is None else config
    threshold = config.get("confidence_threshold", DEFAULT_CONFIDENCE_THRESHOLD)
    if not 0 < threshold <= 1:
        raise ValueError("confidence_threshold must be in (0, 1]")

    if not scored_candidates:
        return {"confidence": 0.0, "is_confident": False, "reason": "no_candidates"}
    if len(scored_candidates) == 1:
        return {"confidence": 1.0, "is_confident": True, "reason": "single_candidate"}

    winner, runner_up = nlargest(2, scored_candidates, key=itemgetter("total_score"))
    score_gap = winner["total_score"] - runner_up["total_score"]

    winner_scores = winner.get("aesthetic_scores", {})
    runner_up_scores = runner_up.get("aesthetic_scores", {})
    shared_dimensions = (winner_scores.keys() & runner_up_scores.keys()) - {"overall"}
    opposing_gap = max(
        (runner_up_scores[dimension] - winner_scores[dimension]
         for dimension in shared_dimensions),
        default=0.0,
    )
    confidence = max(0.0, score_gap - max(0.0, opposing_gap))

    if _meets_threshold(confidence, threshold):
        return {
            "confidence": confidence,
            "is_confident": True,
            "reason": "sufficient_margin",
        }

    reason = "small_score_gap"
    if opposing_gap > 0 and _meets_threshold(score_gap, threshold):
        reason = "dimension_disagreement"
    return {"confidence": confidence, "is_confident": False, "reason": reason}


def _meets_threshold(margin, threshold):
    # Subtracting two floating-point scores can round a boundary value down.
    return margin >= threshold or isclose(margin, threshold, rel_tol=1e-12)
