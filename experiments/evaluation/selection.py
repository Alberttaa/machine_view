"""Measure group-level agreement with human picks and selection latency."""

from statistics import fmean

from algorithms.selection import run_selection


MODES = ("aesthetic_only", "hybrid")


def evaluate_groups(groups, config=None):
    """Evaluate both modes on the same quality-screened, annotated groups.

    An empty `best_image_ids` list is a human decision to abstain. A crop is
    matched to the labels via its source image ID. Labels are used only
    after selection, and neither mode receives feedback from the test set.
    """
    if not groups:
        raise ValueError("The evaluation requires at least one annotated group")

    settings = {} if config is None else config
    rows = []
    seen_groups = set()
    for index, group in enumerate(groups):
        group_id = group["group_id"]
        if not isinstance(group_id, str) or not group_id or group_id in seen_groups:
            raise ValueError(f"Invalid or duplicate group_id: {group_id!r}")
        seen_groups.add(group_id)

        candidates = group["candidates"]
        labels = group["best_image_ids"]
        source_ids = {candidate["source_image_id"] for candidate in candidates}
        if not isinstance(labels, list) or any(not isinstance(label, str) for label in labels):
            raise ValueError(f"Group {group_id!r}: best_image_ids must be a list of strings")
        if set(labels) - source_ids:
            raise ValueError(f"Group {group_id!r}: best_image_ids must reference candidate source images")

        row = {"group_id": group_id, "best_image_ids": labels}
        # Alternate execution order to reduce timing bias from always running one mode first.
        for mode in (MODES if index % 2 == 0 else reversed(MODES)):
            outcome = run_selection(
                candidates, group["quality_results"], config={**settings, "selection_mode": mode},
            )
            best_image_id = outcome["best_image_id"]
            recommended = outcome["best_candidate_id"] is not None
            row[mode] = {
                "status": outcome["status"],
                "best_image_id": best_image_id,
                "best_candidate_id": outcome["best_candidate_id"],
                "agrees": best_image_id in labels if labels else not recommended,
                "selected_aesthetic_score": outcome["candidates"][0]["total_score"]
                if recommended else None,
                "processing_time_seconds": outcome["processing_time"],
                "preference_triggered": outcome["preference_triggered"],
            }
        rows.append(row)

    summary = {}
    for mode in MODES:
        results = [row[mode] for row in rows]
        count = len(results)
        picked_scores = [
            result["selected_aesthetic_score"]
            for result in results
            if result["selected_aesthetic_score"] is not None
        ]
        agreements = sum(result["agrees"] for result in results)
        summary[mode] = {
            "group_count": count,
            "agreement_count": agreements,
            "agreement_rate": agreements / count,
            "recommendation_count": len(picked_scores),
            "mean_selected_aesthetic_score": fmean(picked_scores) if picked_scores else None,
            "mean_processing_time_seconds": fmean(result["processing_time_seconds"] for result in results),
            "preference_trigger_rate": sum(result["preference_triggered"] for result in results) / count,
        }

    return {"summary": summary, "groups": rows}
