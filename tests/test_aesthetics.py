import unittest
from unittest.mock import patch

from algorithms.aesthetics.scorer import score_candidates


class ScoreCandidatesTests(unittest.TestCase):
    def test_sorts_and_ranks_actual_model_dimensions(self):
        candidates = [
            {"candidate_id": "img_001", "image_path": "original.jpg"},
            {"candidate_id": "img_001_crop_01", "image_path": "crop.jpg"},
            {"candidate_id": "img_002", "image_path": "other.jpg"},
        ]
        predictions = {
            "original.jpg": {"overall": 0.61},
            "crop.jpg": {"overall": 0.83, "composition": 0.92},
            "other.jpg": {"overall": 0.83},
        }

        results = score_candidates(candidates, {"predict": predictions.__getitem__})

        self.assertEqual(results, [
            {
                "candidate_id": "img_001_crop_01",
                "aesthetic_scores": {"overall": 0.83, "composition": 0.92},
                "total_score": 0.83,
                "rank": 1,
            },
            {
                "candidate_id": "img_002",
                "aesthetic_scores": {"overall": 0.83},
                "total_score": 0.83,
                "rank": 2,
            },
            {
                "candidate_id": "img_001",
                "aesthetic_scores": {"overall": 0.61},
                "total_score": 0.61,
                "rank": 3,
            },
        ])

    def test_empty_candidates_do_not_require_model(self):
        self.assertEqual(score_candidates([]), [])

    def test_default_loads_the_aesthetic_model(self):
        candidates = [{"candidate_id": "img_001", "image_path": "image.jpg"}]
        with patch("algorithms.aesthetics.scorer.load_aesthetic_model") as load_model:
            load_model.return_value.return_value = {"overall": 0.75}
            results = score_candidates(candidates)

        load_model.assert_called_once_with()
        load_model.return_value.assert_called_once_with("image.jpg")
        self.assertEqual(results[0]["total_score"], 0.75)

    def test_rejects_a_noncallable_custom_predictor(self):
        with self.assertRaisesRegex(ValueError, "callable"):
            score_candidates(
                [{"candidate_id": "img_001", "image_path": "image.jpg"}],
                {"predict": None},
            )

    def test_rejects_missing_or_invalid_scores(self):
        candidates = [{"candidate_id": "img_001", "image_path": "image.jpg"}]
        for scores in (
            {},
            {"overall": float("nan")},
            {"overall": -0.1},
            {"overall": 0.5, "composition": 1.1},
        ):
            with self.subTest(scores=scores):
                with self.assertRaisesRegex(ValueError, "img_001"):
                    score_candidates(candidates, {"predict": lambda _: scores})
