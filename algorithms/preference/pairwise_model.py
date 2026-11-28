"""A learned linear Bradley–Terry head on frozen CLIP features."""

from functools import lru_cache
import json
from pathlib import Path

from algorithms.aesthetics.model_loader import load_aesthetic_model


def fit_pairwise_head(differences, targets, regularization=0.01):
    """Fit soft preference ratios against left-minus-right feature vectors."""
    import torch

    weights = torch.zeros(differences.shape[1], requires_grad=True)
    optimizer = torch.optim.LBFGS([weights], max_iter=100, line_search_fn="strong_wolfe")

    def loss():
        optimizer.zero_grad()
        logits = differences @ weights
        value = torch.nn.functional.binary_cross_entropy_with_logits(logits, targets)
        value = value + regularization * weights.square().sum() / 2
        value.backward()
        return value

    optimizer.step(loss)
    return weights.detach()


def signed_margin(left_utility, right_utility):
    """Map the utility difference to B3's signed margin in [-1, 1]."""
    from math import tanh

    return tanh((left_utility - right_utility) / 2)


def load_pairwise_predictor(checkpoint):
    """Load a predictor suitable for one selection job's pairwise_predict."""
    import torch

    contents = json.loads(Path(checkpoint).read_text(encoding="utf-8"))
    if contents["encoder"] != "CLIP ViT-B/32":
        raise ValueError("Unsupported preference checkpoint encoder")
    weights = torch.tensor(contents["weights"], dtype=torch.float32)
    if weights.shape != (512,) or not weights.isfinite().all():
        raise ValueError("The preference checkpoint requires 512 finite weights")
    encoder = load_aesthetic_model()

    @lru_cache(maxsize=10)
    def utility(image_path):
        return (encoder.encode([image_path])[0] @ weights).item()

    def compare(left, right):
        return signed_margin(utility(left["image_path"]), utility(right["image_path"]))

    return compare
