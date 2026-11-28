import unittest
from unittest.mock import Mock

from experiments.evaluation.selection import evaluate_groups


class EvaluateGroupsTests(unittest.TestCase):
    def setUp(self):
        self.candidates = [
            {"candidate_id": "img_001", "source_image_id": "img_001", "image_path": "a.jpg"},
            {"candidate_id": "img_002_crop", "source_image_id": "img_002", "image_path": "b.jpg"},
        ]
        self.quality = [
            {"candidate_id": candidate["candidate_id"], "is_valid": True}
            for candidate in self.candidates
        ]

    def test_agreement_uses_original_ids_and_counts_abstentions(self):
        rejected = [{**quality, "is_valid": False} for quality in self.quality]
        groups = [
            {"group_id": "crop", "best_image_ids": ["img_002"],
             "candidates": self.candidates, "quality_results": self.quality},
            {"group_id": "screened_out_truth", "best_image_ids": ["img_001"],
             "candidates": self.candidates, "quality_results": rejected},
            {"group_id": "no_recommendation", "best_image_ids": [],
             "candidates": self.candidates, "quality_results": rejected},
        ]
        scores = {"a.jpg": {"overall": 0.81}, "b.jpg": {"overall": 0.80}}
        predict_pair = Mock(return_value=-0.1)

        report = evaluate_groups(
            groups, {"predict": scores.__getitem__, "pairwise_predict": predict_pair},
        )

        baseline, hybrid = (report["summary"][mode] for mode in ("aesthetic_only", "hybrid"))
        self.assertAlmostEqual(baseline["agreement_rate"], 1 / 3)
        self.assertAlmostEqual(hybrid["agreement_rate"], 2 / 3)
        self.assertEqual(baseline["recommendation_count"], 1)
        self.assertEqual(hybrid["mean_selected_aesthetic_score"], 0.80)
        self.assertAlmostEqual(hybrid["preference_trigger_rate"], 1 / 3)
        self.assertGreaterEqual(hybrid["mean_processing_time_seconds"], 0)
        self.assertEqual(report["groups"][0]["hybrid"]["best_candidate_id"], "img_002_crop")
        self.assertFalse(report["groups"][1]["hybrid"]["agrees"])
        self.assertTrue(report["groups"][2]["hybrid"]["agrees"])
        predict_pair.assert_called_once()

    def test_accepts_either_human_top_pick(self):
        group = {"group_id": "tie", "best_image_ids": ["img_001", "img_002"],
                 "candidates": self.candidates, "quality_results": self.quality}
        result = evaluate_groups([group], {"predict": lambda _: {"overall": 0.5}})

        self.assertEqual(result["summary"]["aesthetic_only"]["agreement_count"], 1)
        self.assertEqual(result["summary"]["hybrid"]["agreement_count"], 1)

    def test_rejects_an_unmatched_label_or_empty_dataset(self):
        group = {"group_id": "bad_label", "best_image_ids": ["img_002_crop"],
                 "candidates": self.candidates, "quality_results": self.quality}
        with self.assertRaisesRegex(ValueError, "source images"):
            evaluate_groups([group])
        with self.assertRaisesRegex(ValueError, "at least one"):
            evaluate_groups([])
