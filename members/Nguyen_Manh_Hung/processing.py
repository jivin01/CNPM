import numpy as np
from PIL import Image, ImageFilter, ImageDraw
import io

# Try to import more advanced libs; if unavailable we'll fallback to simple method
try:
    from skimage.filters import frangi, threshold_otsu
    from skimage.morphology import skeletonize
    from scipy.ndimage import distance_transform_edt, convolve
    from skimage.measure import label as sk_label
    SKIMAGE_AVAILABLE = True
except Exception:
    SKIMAGE_AVAILABLE = False


def analyze_image(image_bytes: bytes):
    """Retinal vessel segmentation and metrics.

    If scikit-image + scipy are available this function will run a better
    Frangi-based vessel enhancement -> threshold -> skeletonize pipeline and
    return additional metrics:
      - skeleton_length_pixels
      - mean_vessel_width_pixels
      - branch_point_count
      - component_count

    If the libraries are not available it falls back to a lightweight PIL
    FIND_EDGES pipeline (previous implementation).

    Returns: (annotated_image_bytes, metrics_dict)
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # resize for speed if large
    max_side = 1024
    if max(img.size) > max_side:
        img = img.resize((int(img.width * max_side / max(img.size)), int(img.height * max_side / max(img.size))))

    width, height = img.size

    if SKIMAGE_AVAILABLE:
        # convert to grayscale numpy array, normalized
        gray = np.array(img.convert('L'), dtype=np.float32) / 255.0

        # vessel enhancement (Frangi) - returns float image
        try:
            fr = frangi(gray)
        except Exception:
            fr = frangi(gray, scale_range=(1,8), scale_step=2)

        # threshold Frangi response with Otsu (works on floats)
        try:
            thr = threshold_otsu(fr)
            vessel_mask = fr > thr
        except Exception:
            # fallback threshold
            vessel_mask = fr > (np.mean(fr) * 0.5)

        vessel_mask = vessel_mask.astype(bool)

        # cleanup small objects by simple labeling (remove very small components)
        try:
            comps = sk_label(vessel_mask)
            counts = np.bincount(comps.ravel())
            # keep components larger than small_thresh pixels
            small_thresh = 30
            keep = np.zeros_like(counts, dtype=bool)
            keep_size = counts > small_thresh
            keep[keep_size] = True
            keep[0] = False
            nice = keep[comps]
            vessel_mask = nice
        except Exception:
            pass

        # skeletonize
        skeleton = skeletonize(vessel_mask)

        # skeleton length (in pixels)
        skeleton_length = int(np.sum(skeleton))

        # distance transform on vessel mask to get radius at each vessel pixel
        dist = distance_transform_edt(vessel_mask)
        # measure radius at skeleton points
        radii_on_skel = dist[skeleton]
        if radii_on_skel.size > 0:
            mean_width = float(np.mean(radii_on_skel) * 2.0)
        else:
            mean_width = 0.0

        # branch points: count skeleton pixels with >=3 neighbors
        kernel = np.array([[1,1,1],[1,0,1],[1,1,1]], dtype=np.int32)
        neigh = convolve(skeleton.astype(np.int32), kernel, mode='constant', cval=0)
        branch_points = int(np.sum((skeleton) & (neigh >= 3)))
        end_points = int(np.sum((skeleton) & (neigh == 1)))

        # component count
        try:
            comp_count = int(np.max(sk_label(vessel_mask)))
        except Exception:
            comp_count = int(np.sum(vessel_mask))

        # create annotated overlay: mask in red, skeleton in green
        overlay = Image.new('RGBA', img.size, (0,0,0,0))
        ov_pixels = overlay.load()
        vm = vessel_mask
        sk = skeleton
        for y in range(height):
            for x in range(width):
                if vm[y, x] if vm.shape[0]==height else vm[x,y]:
                    # vessel mask -> red with alpha
                    ov_pixels[x,y] = (255,0,0,120)
                if sk[y, x] if sk.shape[0]==height else sk[x,y]:
                    # skeleton -> bright green (overwrite)
                    ov_pixels[x,y] = (0,255,0,200)

        annotated = Image.alpha_composite(img.convert('RGBA'), overlay)

        # prepare bytes
        out = io.BytesIO()
        annotated.save(out, format='PNG')
        annotated_bytes = out.getvalue()

        metrics = {
            'width': width,
            'height': height,
            'vessel_pixel_count': int(np.sum(vessel_mask)),
            'vessel_density': float(np.sum(vessel_mask) / (width*height)) if width*height>0 else 0.0,
            'skeleton_length_pixels': skeleton_length,
            'mean_vessel_width_pixels': mean_width,
            'branch_point_count': branch_points,
            'end_point_count': end_points,
            'component_count': comp_count
        }

        return annotated_bytes, metrics

    # Fallback: original simple method
    gray = img.convert("L")

    # simple edge detection: use PIL's FIND_EDGES and a median filter
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edges = edges.filter(ImageFilter.MedianFilter(size=3))

    # threshold
    bw = edges.point(lambda p: 255 if p > 30 else 0)

    # create annotated overlay (red) where edges found
    overlay = Image.new("RGBA", img.size, (0,0,0,0))
    draw = ImageDraw.Draw(overlay)
    pixels = bw.load()
    vessel_pixels = 0
    for y in range(height):
        for x in range(width):
            if pixels[x,y] > 0:
                draw.point((x,y), fill=(255,0,0,180))
                vessel_pixels += 1

    annotated = Image.alpha_composite(img.convert("RGBA"), overlay)

    # prepare bytes
    out = io.BytesIO()
    annotated.save(out, format="PNG")
    annotated_bytes = out.getvalue()

    metrics = {
        "width": width,
        "height": height,
        "vessel_pixel_count": vessel_pixels,
        "vessel_density": vessel_pixels / (width*height)
    }

    return annotated_bytes, metrics
