import unittest

from algorithms.confidence.evaluator import evaluate_confidence


class EvaluateConfidenceTests(unittest.TestCase):
    def test_uses_top_two_scores_without_changing_candidate_order(self):
        candidates = [
            {"total_score": 0.70, "aesthetic_scores": {"overall": 0.70}},
            {"total_score": 0.40, "aesthetic_scores": {"overall": 0.40}},
            {"total_score": 0.80, "aesthetic_scores": {"overall": 0.80}},
        ]

        result = evaluate_confidence(candidates)

        self.assertTrue(result["is_confident"])
        self.assertAlmostEqual(result["confidence"], 0.10)
        self.assertEqual(result["reason"], "sufficient_margin")
        self.assertEqual([item["total_score"] for item in candidates], [0.70, 0.40, 0.80])

    def test_reaches_threshold_at_floating_point_boundary(self):
        candidates = [{"total_score": 0.9}, {"total_score": 0.8}]

        result = evaluate_confidence(candidates, {"confidence_threshold": 0.1})

        self.assertTrue(result["is_confident"])
        self.assertAlmostEqual(result["confidence"], 0.1)

    def test_close_scores_and_ties_require_preference_comparison(self):
        for next_score in (0.77, 0.8):
            with self.subTest(next_score=next_score):
                result = evaluate_confidence([{"total_score": 0.8}, {"total_score": next_score}])

                self.assertFalse(result["is_confident"])
                self.assertEqual(result["reason"], "small_score_gap")
                self.assertAlmostEqual(result["confidence"], 0.8 - next_score)

    def test_disagreement_on_a_shared_dimension_reduces_confidence(self):
        candidates = [
            {"total_score": 0.80, "aesthetic_scores": {"composition": 0.60, "color": 0.90}},
            {"total_score": 0.70, "aesthetic_scores": {"composition": 0.68, "lighting": 0.99}},
        ]

        result = evaluate_confidence(candidates)

        self.assertFalse(result["is_confident"])
        self.assertAlmostEqual(result["confidence"], 0.02)
        self.assertEqual(result["reason"], "dimension_disagreement")

    def test_agreement_and_unshared_dimensions_preserve_the_total_gap(self):
        candidates = [
            {"total_score": 0.80, "aesthetic_scores": {"composition": 0.80, "color": 0.20}},
            {"total_score": 0.70, "aesthetic_scores": {"composition": 0.68, "lighting": 0.99}},
        ]

        result = evaluate_confidence(candidates)

        self.assertTrue(result["is_confident"])
        self.assertAlmostEqual(result["confidence"], 0.10)

    def test_zero_and_one_candidate(self):
        self.assertEqual(evaluate_confidence([]), {
            "confidence": 0.0, "is_confident": False, "reason": "no_candidates",
        })
        self.assertEqual(evaluate_confidence([{"total_score": 0.2}]), {
            "confidence": 1.0, "is_confident": True, "reason": "single_candidate",
        })

    def test_rejects_an_invalid_threshold(self):
        for threshold in (0.0, -0.1, 1.1, float("nan")):
            with self.subTest(threshold=threshold):
                with self.assertRaisesRegex(ValueError, "confidence_threshold"):
                    evaluate_confidence([], {"confidence_threshold": threshold})
