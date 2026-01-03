import requests
import base64
import argparse
import os
import sys
import json


def main():
    parser = argparse.ArgumentParser(description="Test /analyze endpoint")
    parser.add_argument("image", help="Path to input image")
    parser.add_argument("--upload", action="store_true", help="Request upload to Cloudinary (requires env configured)")
    parser.add_argument("--url", default="http://127.0.0.1:8010", help="Base URL of the service")
    args = parser.parse_args()

    img_path = args.image
    if not os.path.isfile(img_path):
        print(f"File not found: {img_path}")
        sys.exit(1)

    endpoint = f"{args.url.rstrip('/')}/analyze"
    params = {"upload": "true"} if args.upload else {"upload": "false"}

    with open(img_path, "rb") as f:
        files = {"file": (os.path.basename(img_path), f, "image/jpeg")}
        print(f"POST {endpoint} (upload={args.upload})")
        try:
            r = requests.post(endpoint, params=params, files=files, timeout=60)
        except Exception as e:
            print("Request failed:", e)
            sys.exit(1)

    print("Status:", r.status_code)
    try:
        data = r.json()
    except Exception:
        print("Non-JSON response:\n", r.text)
        sys.exit(1)

    if r.status_code != 200:
        print(json.dumps(data, indent=2, ensure_ascii=False))
        sys.exit(1)

    print("Metrics:")
    print(json.dumps(data.get("metrics", {}), indent=2))

    b64 = data.get("annotated_image_base64")
    if b64:
        out_name = f"annotated_{os.path.splitext(os.path.basename(img_path))[0]}.png"
        with open(out_name, "wb") as out:
            out.write(base64.b64decode(b64))
        print("Saved annotated image to:", out_name)

    if data.get("cloudinary_url"):
        print("Cloudinary URL:", data.get("cloudinary_url"))
    if data.get("cloudinary_error"):
        print("Cloudinary error:", data.get("cloudinary_error"))


if __name__ == '__main__':
    main()
