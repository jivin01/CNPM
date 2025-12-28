import cv2
import numpy as np
from pathlib import Path
from typing import Tuple


def analyze_image(input_path: str, output_path: str) -> Tuple[float, str]:
    """A simple stub that generates a fake vessel mask and an annotated image.
    Returns (risk_score, annotated_image_path)
    """
    img = cv2.imread(input_path)
    if img is None:
        raise ValueError("Cannot read image")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 30, 100)
    # make mask RGB
    mask = np.zeros_like(img)
    mask[:, :, 1] = edges  # green channel

    annotated = cv2.addWeighted(img, 0.8, mask, 0.5, 0)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(output_path, annotated)

    # risk score heuristic: proportion of edge pixels
    risk_score = float(edges.sum()) / (edges.size * 255) * 100
    return risk_score, str(output_path)
