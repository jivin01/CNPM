import os
import random
import json

def predict(image_path: str) -> dict:
	"""Placeholder AI predictor for retinal images.
	Returns a fake diagnosis with confidence. Replace with real model call.
	"""
	# Basic sanity check
	if not os.path.exists(image_path):
		raise FileNotFoundError(f"Image not found: {image_path}")

	diseases = [
		("No DR", 0.7),
		("Mild DR", 0.2),
		("Moderate DR", 0.07),
		("Severe DR", 0.03)
	]
	labels = [d[0] for d in diseases]
	probs = [d[1] for d in diseases]

	# Random choice weighted by probs for demo
	choice = random.choices(labels, weights=probs, k=1)[0]
	confidence = round(0.6 + random.random() * 0.4, 3)

	return {
		"disease": choice,
		"confidence": confidence,
		"notes": "This is a demo prediction. Integrate your model here."
	}

def predict_json(image_path: str) -> str:
	return json.dumps(predict(image_path))
