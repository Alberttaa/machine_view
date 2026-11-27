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
