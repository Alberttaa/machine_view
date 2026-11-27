from pathlib import Path
from PIL import Image, ImageOps


def read_image_info(image_path):
    path = Path(image_path)
    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img)
        return {
            "filename": path.name,
            "format": (img.format or path.suffix.lstrip(".")).lower(),
            "width": img.width,
            "height": img.height,
        }



def preprocess_images(image_paths, output_dir=None):
    """最小版本：建立 image_id 并读取元信息。"""
    results = []
    for image_path in image_paths:
        info = read_image_info(image_path)
        results.append({
            "image_id": Path(image_path).stem,
            "filename": info["filename"],
            "image_path": str(image_path),
            "format": info["format"],
            "width": info["width"],
            "height": info["height"],
        })
    return results

