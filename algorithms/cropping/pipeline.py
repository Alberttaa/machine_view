def generate_candidates(image_list, output_dir, config=None):
    """为每个原图生成 original 候选（暂不做裁剪）。"""
    candidates = []
    for image in image_list:
        if image.get("defects"):
            continue
        candidates.append({
            "candidate_id": image["image_id"],
            "source_image_id": image["image_id"],
            "image_path": image["image_path"],
            "candidate_type": "original",
            "crop_box": None,
            "width": image["width"],
            "height": image["height"],
        })
    return candidates
