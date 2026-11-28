import unittest
from unittest.mock import Mock

from algorithms.selection import run_selection


class RunSelectionTests(unittest.TestCase):
    def setUp(self):
        self.candidates = [
            {"candidate_id": "img_002", "source_image_id": "img_002", "image_path": "other.jpg"},
            {"candidate_id": "img_001_crop_01", "source_image_id": "img_001", "image_path": "crop.jpg",
             "candidate_type": "crop", "crop_box": [0.1, 0.1, 0.9, 0.9]},
            {"candidate_id": "img_003", "source_image_id": "img_003", "image_path": "rejected.jpg"},
        ]
        self.quality = [
            {"candidate_id": "img_003", "is_valid": False, "defects": ["severe_blur"]},
            {"candidate_id": "img_001_crop_01", "is_valid": True},
            {"candidate_id": "img_002", "is_valid": True},
        ]

    def test_high_confidence_filters_quality_and_maps_crop_to_original(self):
        scores = {"crop.jpg": {"overall": 0.9}, "other.jpg": {"overall": 0.7}}
        pairwise_predict = Mock()

        result = run_selection(
            self.candidates,
            self.quality,
            config={"predict": scores.__getitem__, "pairwise_predict": pairwise_predict},
        )

        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["best_candidate_id"], "img_001_crop_01")
        self.assertEqual(result["best_image_id"], "img_001")
        self.assertFalse(result["preference_triggered"])
        self.assertAlmostEqual(result["confidence"], 0.2)
        self.assertGreaterEqual(result["processing_time"], 0.0)
        top, _, rejected = result["candidates"]
        self.assertEqual(top["crop_box"], [0.1, 0.1, 0.9, 0.9])
        self.assertEqual(top["rank"], 1)
        self.assertEqual(rejected["quality_status"], "rejected")
        self.assertEqual(rejected["defects"], ["severe_blur"])
        self.assertNotIn("total_score", rejected)
        self.assertNotIn("rank", rejected)
        pairwise_predict.assert_not_called()

    def test_low_confidence_applies_feedback_and_returns_final_rank(self):
        scores = {"crop.jpg": {"overall": 0.8}, "other.jpg": {"overall": 0.81}}
        feedback = {
            "task_id": "task_001",
            "feedback_type": "override",
            "selected_image_id": "img_001",
            "recommended_image_id": "img_002",
        }

        result = run_selection(
            self.candidates, self.quality, [feedback],
            {"predict": scores.__getitem__, "task_id": "task_001"},
        )

        self.assertTrue(result["preference_triggered"])
        self.assertEqual(result["best_candidate_id"], "img_001_crop_01")
        self.assertEqual(result["best_image_id"], "img_001")
        self.assertAlmostEqual(result["confidence"], 0.01)
        top = result["candidates"][0]
        self.assertEqual(top["aesthetic_rank"], 2)
        self.assertEqual(top["rank"], 1)
        self.assertEqual(top["preference_rank"], 1)
        self.assertNotIn("rank", self.candidates[1])

    def test_all_poor_and_empty_skip_scoring(self):
        predict = Mock()
        config = {"predict": predict}
        for candidates, quality in ((self.candidates[2:], self.quality[:1]), ([], [])):
            with self.subTest(candidates=candidates):
                result = run_selection(candidates, quality, config=config)

                self.assertEqual(result["status"], "all_poor")
                self.assertIsNone(result["best_image_id"])
                self.assertIsNone(result["best_candidate_id"])
                self.assertIsNone(result["confidence"])
                self.assertFalse(result["preference_triggered"])
                self.assertEqual(len(result["candidates"]), len(candidates))
                self.assertTrue(result["message"])
        predict.assert_not_called()

    def test_single_valid_candidate_does_not_run_preference(self):
        pairwise_predict = Mock()
        result = run_selection(
            self.candidates[1:], self.quality[:2],
            config={"predict": lambda _: {"overall": 0.4}, "pairwise_predict": pairwise_predict},
        )

        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["best_image_id"], "img_001")
        self.assertFalse(result["preference_triggered"])
        pairwise_predict.assert_not_called()

    def test_missing_quality_record_raises_before_scoring(self):
        predict = Mock()
        with self.assertRaisesRegex(ValueError, "img_003"):
            run_selection(self.candidates, self.quality[1:], config={"predict": predict})
        predict.assert_not_called()

    def test_rejects_duplicate_candidate_and_quality_ids(self):
        with self.assertRaisesRegex(ValueError, "Duplicate candidate ID"):
            run_selection(self.candidates + self.candidates[:1], self.quality)
        with self.assertRaisesRegex(ValueError, "quality_results"):
            run_selection(self.candidates, self.quality + self.quality[:1])
