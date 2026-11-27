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



def preprocess_images(image_paths, output_dir="tests/data/working"):
    """建立 image_id，读取元信息，并生成工作副本。"""
    results = []
    for image_path in image_paths:
        info = read_image_info(image_path)
        working_path = create_working_copy(image_path, output_dir)
        results.append({
            "image_id": Path(image_path).stem,
            "filename": info["filename"],
            "image_path": str(image_path),
            "working_path": working_path,
            "format": info["format"],
            "width": info["width"],
            "height": info["height"],
        })
    return results



def create_working_copy(image_path, output_dir, max_side=1024):
    """生成统一尺寸的工作副本，原图保持不变。"""
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    path = Path(image_path)
    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img).convert("RGB")
        img.thumbnail((max_side, max_side))
        working_path = out / f"{path.stem}_work.jpg"
        img.save(working_path, quality=92)
    return str(working_path)


