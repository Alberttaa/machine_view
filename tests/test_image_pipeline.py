import unittest
from pathlib import Path
from PIL import Image
from algorithms.image_pipeline import prepare_candidates


class TestImagePipeline(unittest.TestCase):
    def setUp(self):
        self.tmp = Path("tests/data/test_tmp")
        self.tmp.mkdir(parents=True, exist_ok=True)
        for i in range(3):
            Image.new("RGB", (60, 40), (i * 60, 100, 150)).save(self.tmp / f"t{i}.jpg")

    def test_mapping(self):
        paths = [str(self.tmp / f"t{i}.jpg") for i in range(3)]
        r = prepare_candidates(paths, "tests/data/working")
        self.assertEqual(len(r["candidates"]), 3)
        ids = [c["candidate_id"] for c in r["candidates"]]
        self.assertEqual(len(ids), len(set(ids)))
        source_ids = [x["image_id"] for x in r["images"]]
        for c in r["candidates"]:
            self.assertIn(c["source_image_id"], source_ids)

    def test_empty(self):
        r = prepare_candidates([], "tests/data/working")
        self.assertEqual(r["candidates"], [])


if __name__ == "__&#8203;main__":
    unittest.main()
