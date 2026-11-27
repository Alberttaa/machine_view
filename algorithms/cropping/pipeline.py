from pathlib import Path
from PIL import Image

def generate_candidates(image_list, output_dir, config=None):
    """生成候选：每张原图保留 original；开启 smart_crop 时追加裁剪候选。"""
    config = config or {}
    smart_crop = config.get("smart_crop", False)
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
        if smart_crop:
            candidates.append(make_center_crop_candidate(image, output_dir))
    return candidates

def make_center_crop_candidate(image, output_dir):
    """生成一个中心方形裁剪候选，保持 source_image_id 映射。"""
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    src = image["working_path"] or image["image_path"]
    with Image.open(src) as img:
        w, h = img.size
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        crop = img.crop((left, top, left + side, top + side))
        name = f"{image['image_id']}__crop_01.jpg"
        crop.save(out / name, quality=92)
        box = [left / w, top / h, (left + side) / w, (top + side) / h]
    return {
        "candidate_id": f"{image['image_id']}__crop_01",
        "source_image_id": image["image_id"],
        "image_path": str(out / name),
        "candidate_type": "crop",
        "crop_box": box,
        "width": side,
        "height": side,
    }
