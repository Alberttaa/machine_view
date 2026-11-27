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
    """建立 image_id，生成工作副本，标记重复图；损坏图跳过但保留记录。"""
    results = []
    seen_hashes = {}
    for image_path in image_paths:
        path = Path(image_path)
        try:
            info = read_image_info(image_path)
            digest = image_dhash(image_path)
            working_path = create_working_copy(image_path, output_dir)
            is_duplicate = digest in seen_hashes
            if not is_duplicate:
                seen_hashes[digest] = path.stem
            results.append({
                "image_id": path.stem,
                "filename": path.name,
                "image_path": str(image_path),
                "working_path": working_path,
                "format": info["format"],
                "width": info["width"],
                "height": info["height"],
                "is_duplicate": is_duplicate,
                "defects": [],
            })
        except Exception:
            results.append({
                "image_id": path.stem,
                "filename": path.name,
                "image_path": str(image_path),
                "working_path": None,
                "format": None,
                "width": None,
                "height": None,
                "is_duplicate": False,
                "defects": ["unreadable"],
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

def image_dhash(image_path, hash_size=8):
    """计算 dHash，用于检测内容相同的重复图片。"""
    size = hash_size + 1
    with Image.open(image_path) as img:
        img = ImageOps.exif_transpose(img).convert("L").resize((size, hash_size))
        pixels = list(img.getdata())
    bits = 0
    for row in range(hash_size):
        for col in range(hash_size):
            left = pixels[row * size + col]
            right = pixels[row * size + col + 1]
            bits = (bits << 1) | (1 if left > right else 0)
    return bits

