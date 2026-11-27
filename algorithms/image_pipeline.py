from algorithms.preprocessing.pipeline import preprocess_images
from algorithms.cropping.pipeline import generate_candidates
from algorithms.quality.pipeline import check_image_quality


def prepare_candidates(image_paths, output_dir, config=None):
    """A 的统一入口：预处理 → 候选生成 → 质量筛查。"""
    images = preprocess_images(image_paths, output_dir)
    candidates = generate_candidates(images, output_dir, config)
    quality_results = check_image_quality(candidates, config)
    valid_ids = {q["candidate_id"] for q in quality_results if q["is_valid"]}
    valid_candidates = [c for c in candidates if c["candidate_id"] in valid_ids]
    return {
        "images": images,
        "candidates": candidates,
        "quality_results": quality_results,
        "valid_candidates": valid_candidates,
    }
