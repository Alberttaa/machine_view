"""Load the LAION V1 aesthetic predictor with OpenAI CLIP ViT-B/32."""

from functools import lru_cache
from hashlib import file_digest
from math import isfinite
from pathlib import Path


DEFAULT_CHECKPOINT_DIR = Path(__file__).resolve().parents[2] / "models" / "checkpoints"
_CHECKPOINTS = {
    "ViT-B-32.pt": "40d365715913c9da98579312b702a82c18be219cc2a73407c4526f58eba950af",
    "sa_0_4_vit_b_32_linear.pth": "c7b14cead230694acc7b9447974d3cad78003c72da032e402a303b6c2429e85f",
}


def load_aesthetic_model(checkpoint_dir=DEFAULT_CHECKPOINT_DIR):
    """Return a reusable CPU predictor for the specified checkpoint directory."""
    return _load_model(Path(checkpoint_dir).resolve())


@lru_cache(maxsize=1)
def _load_model(checkpoint_dir):
    for filename, expected_digest in _CHECKPOINTS.items():
        path = checkpoint_dir / filename
        if not path.is_file():
            raise FileNotFoundError(f"Missing aesthetic checkpoint {path}. See models/README.md.")
        with path.open("rb") as checkpoint:
            if file_digest(checkpoint, "sha256").hexdigest() != expected_digest:
                raise ValueError(f"Invalid SHA-256 for aesthetic checkpoint {path}")

    try:
        import clip
        import torch
        from PIL import Image, ImageOps
    except ImportError as error:
        raise RuntimeError("Install the aesthetic model dependencies in models/README.md.") from error

    encoder, preprocess = clip.load(str(checkpoint_dir / "ViT-B-32.pt"), device="cpu")
    vision = encoder.visual.eval()
    head = torch.nn.Linear(512, 1)
    head.load_state_dict(torch.load(
        checkpoint_dir / "sa_0_4_vit_b_32_linear.pth",
        map_location="cpu",
        weights_only=True,
    ))
    head.eval()

    def predict(image_path):
        with Image.open(image_path) as image:
            pixels = preprocess(ImageOps.exif_transpose(image).convert("RGB")).unsqueeze(0)
        with torch.inference_mode():
            embedding = torch.nn.functional.normalize(vision(pixels).float(), dim=-1)
            raw_score = head(embedding).item()

        if not isfinite(raw_score):
            raise ValueError(f"Invalid LAION aesthetic score for {image_path}")
        return {"overall": min(1.0, max(0.0, raw_score / 10.0))}

    return predict
