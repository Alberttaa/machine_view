import unittest
from unittest.mock import Mock

from algorithms.preference.comparator import compare_candidates


class CompareCandidatesTests(unittest.TestCase):
    def setUp(self):
        self.candidates = [
            {"candidate_id": "a", "source_image_id": "img_001", "total_score": 0.81, "rank": 1},
            {"candidate_id": "b", "source_image_id": "img_002", "total_score": 0.80, "rank": 2},
            {"candidate_id": "c", "source_image_id": "img_003", "total_score": 0.76, "rank": 3},
        ]

    def test_only_compares_the_top_k_and_preserves_aesthetic_rank(self):
        predict = Mock(return_value=-0.5)
        result = compare_candidates(
            self.candidates[::-1], config={"top_k": 2, "pairwise_predict": predict},
        )

        predict.assert_called_once_with(*self.candidates[:2])
        self.assertEqual([item["candidate_id"] for item in result], ["b", "a", "c"])
        self.assertEqual([item["rank"] for item in result], [2, 1, 3])
        self.assertEqual([item["preference_rank"] for item in result], [1, 2, 3])
        self.assertEqual([item["preference_score"] for item in result], [1.0, 0.0, None])
        self.assertEqual([item["in_preference"] for item in result], [True, True, False])
        self.assertNotIn("preference_rank", self.candidates[0])

    def test_general_preference_uses_shared_dimensions_when_available(self):
        first, second = self.candidates[:2]
        first.update(aesthetic_scores={"overall": 0.81, "color": 0.6, "lighting": 1.0})
        second.update(aesthetic_scores={"overall": 0.80, "color": 0.9})

        result = compare_candidates([first, second])

        self.assertEqual(result[0]["candidate_id"], "b")

    def test_feedback_uses_matching_task_and_source_image_ids(self):
        feedback = {
            "task_id": "task_001",
            "feedback_type": "override",
            "recommended_image_id": "img_001",
            "selected_image_id": "img_002",
        }
        self.assertEqual(compare_candidates(self.candidates, [feedback])[0]["candidate_id"], "a")

        result = compare_candidates(
            self.candidates, {"records": [feedback]}, {"task_id": "task_001"},
        )

        self.assertEqual(result[0]["candidate_id"], "b")

    def test_candidate_feedback_and_acceptance(self):
        feedback = {"feedback_type": "manual_select", "recommended_id": "a", "selected_id": "b"}
        self.assertEqual(compare_candidates(self.candidates, feedback)[0]["candidate_id"], "b")

        feedback["feedback_type"] = "accept"
        self.assertEqual(compare_candidates(self.candidates, feedback)[0]["candidate_id"], "a")

    def test_tied_pair_keeps_input_order_and_splits_the_point(self):
        first, second = self.candidates[:2]
        second["total_score"] = first["total_score"]

        result = compare_candidates([second, first])

        self.assertEqual([item["candidate_id"] for item in result], ["b", "a"])
        self.assertEqual([item["preference_score"] for item in result], [0.5, 0.5])

    def test_empty_and_single_candidate_skip_pairwise_prediction(self):
        predict = Mock()
        config = {"pairwise_predict": predict}
        self.assertEqual(compare_candidates([], config=config), [])
        result = compare_candidates(self.candidates[:1], config=config)
        self.assertEqual(result[0]["preference_rank"], 1)
        self.assertFalse(result[0]["in_preference"])
        self.assertIsNone(result[0]["preference_score"])
        predict.assert_not_called()
