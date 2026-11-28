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

    return _AestheticPredictor(vision, preprocess, head)


class _AestheticPredictor:
    def __init__(self, vision, preprocess, head):
        self.vision = vision
        self.preprocess = preprocess
        self.head = head

    def encode(self, image_paths):
        """Encode a nonempty batch as normalized CLIP image embeddings."""
        import torch
        from PIL import Image, ImageOps

        pixels = []
        for image_path in image_paths:
            with Image.open(image_path) as image:
                pixels.append(self.preprocess(ImageOps.exif_transpose(image).convert("RGB")))
        with torch.inference_mode():
            return torch.nn.functional.normalize(self.vision(torch.stack(pixels)).float(), dim=-1)

    def score_embeddings(self, embeddings):
        import torch

        with torch.inference_mode():
            raw_scores = self.head(embeddings).flatten()
        if not all(isfinite(score) for score in raw_scores.tolist()):
            raise ValueError("LAION produced a non-finite aesthetic score")
        return (raw_scores / 10.0).clamp(0.0, 1.0)

    def __call__(self, image_path):
        return {"overall": self.score_embeddings(self.encode([image_path])).item()}
