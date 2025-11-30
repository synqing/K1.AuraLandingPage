#!/usr/bin/env python3
"""
calibrate_optics.py

Estimate optics parameters for the K1 edge-lit shader by analysing
calibration photos of the real device.

Input:
    ./cal/top_impulse_center.jpg
    ./cal/bottom_impulse_center.jpg
    ./cal/collision_center.jpg
    ./cal/edges_only.jpg

Output:
    Prints a JSON block with recommended values for:

        topSpreadNear, topSpreadFar
        bottomSpreadNear, bottomSpreadFar
        topFalloff, bottomFalloff
        columnBoostStrength, columnBoostExponent
        edgeHotspotStrength, edgeHotspotWidth

You can paste these into K1_HERO_PRESET.optics in K1Engine.tsx.

This is deliberately conservative and heuristic: it won’t be “scientific paper
perfect”, but it’ll get you much closer to reality than guessing in Leva.
"""

import json
import math
import os
from dataclasses import dataclass
from typing import Tuple, Optional

import cv2
import numpy as np
from scipy.optimize import curve_fit


# ---------- CONFIG -----------------------------------------------------------

CAL_DIR = os.path.join(os.path.dirname(__file__), "cal")

TOP_IMPULSE_PATH = os.path.join(CAL_DIR, "top_impulse_center.jpg")
BOTTOM_IMPULSE_PATH = os.path.join(CAL_DIR, "bottom_impulse_center.jpg")
COLLISION_PATH = os.path.join(CAL_DIR, "collision_center.jpg")
EDGES_ONLY_PATH = os.path.join(CAL_DIR, "edges_only.jpg")

# If your photos include a lot of background around the K1,
# set these ROIs (in normalized [0–1] coords) to roughly isolate the bar.
# You can tweak and rerun if it crops wrong.
ROI = {
    "x_min": 0.1,
    "x_max": 0.9,
    "y_min": 0.2,
    "y_max": 0.8,
}

# Small epsilon to avoid divide-by-zero etc.
EPS = 1e-6


@dataclass
class ProfileFit:
    k: float
    k_err: float
    amplitude: float


@dataclass
class GaussianFit:
    sigma: float
    mu: float
    amplitude: float


@dataclass
class OpticsResult:
    topSpreadNear: float
    topSpreadFar: float
    bottomSpreadNear: float
    bottomSpreadFar: float
    topFalloff: float
    bottomFalloff: float
    columnBoostStrength: float
    columnBoostExponent: float
    edgeHotspotStrength: float
    edgeHotspotWidth: float


# ---------- BASIC IMAGE UTILS ----------------------------------------------

def load_gray(path: str) -> np.ndarray:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Missing calibration image: {path}")
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise RuntimeError(f"Failed to load image at {path}")
    img = img.astype(np.float32) / 255.0
    return img


def crop_roi(img: np.ndarray) -> np.ndarray:
    h, w = img.shape
    x0 = int(ROI["x_min"] * w)
    x1 = int(ROI["x_max"] * w)
    y0 = int(ROI["y_min"] * h)
    y1 = int(ROI["y_max"] * h)
    x0 = max(0, min(w - 1, x0))
    x1 = max(x0 + 1, min(w, x1))
    y0 = max(0, min(h - 1, y0))
    y1 = max(y0 + 1, min(h, y1))
    cropped = img[y0:y1, x0:x1]
    return cropped


def find_brightest_coord(img: np.ndarray) -> Tuple[int, int]:
    """Return (y, x) of brightest pixel."""
    idx = np.argmax(img)
    y, x = np.unravel_index(idx, img.shape)
    return int(y), int(x)


# ---------- FITTING HELPERS --------------------------------------------------

def exp_decay(y, k, a):
    # y in [0, 1]; brightness ~ a * exp(-k * y)
    return a * np.exp(-k * y)


def gaussian(x, amp, mu, sigma):
    return amp * np.exp(-0.5 * ((x - mu) / (sigma + EPS)) ** 2)


def fit_vertical_profile(profile: np.ndarray, from_top: bool = True) -> Optional[ProfileFit]:
    """
    Fit an exponential decay to a vertical brightness profile.

    profile: 1D array along vertical axis (0 = top of ROI).
    from_top:
        True  -> interpret y=0 at top, grow downward
        False -> interpret y=0 at bottom, so we flip.
    """
    prof = profile.copy()
    n = prof.size
    if not from_top:
        prof = prof[::-1]

    # Normalise to [0,1]
    prof = prof - prof.min()
    if prof.max() < EPS:
        return None
    prof = prof / (prof.max() + EPS)

    y = np.linspace(0.0, 1.0, n, dtype=np.float32)

    # Only fit where signal is above a small threshold
    mask = prof > 0.1
    if mask.sum() < max(5, n // 10):
        # Too few points above threshold, bail out
        return None

    y_fit = y[mask]
    p_fit = prof[mask]

    try:
        popt, pcov = curve_fit(exp_decay, y_fit, p_fit, p0=(3.0, 1.0), maxfev=10000)
        k, a = popt
        k_err = float(np.sqrt(np.diag(pcov))[0]) if pcov is not None else 0.0
        return ProfileFit(k=float(k), k_err=k_err, amplitude=float(a))
    except Exception:
        return None


def fit_horizontal_gaussian(profile: np.ndarray) -> Optional[GaussianFit]:
    """Fit a Gaussian to a horizontal 1D brightness profile."""
    p = profile.copy()
    x = np.linspace(0.0, 1.0, p.size, dtype=np.float32)

    p = p - p.min()
    if p.max() < EPS:
        return None
    p = p / (p.max() + EPS)

    # Focus on central region where brightness is significant
    mask = p > 0.1
    if mask.sum() < max(5, p.size // 10):
        return None

    x_fit = x[mask]
    p_fit = p[mask]
    # Initial guess: peak ~ centre of mass
    mu0 = float(np.sum(x_fit * p_fit) / (np.sum(p_fit) + EPS))
    sigma0 = 0.05
    amp0 = 1.0

    try:
        popt, _ = curve_fit(gaussian, x_fit, p_fit, p0=(amp0, mu0, sigma0), maxfev=10000)
        amp, mu, sigma = popt
        return GaussianFit(sigma=float(abs(sigma)), mu=float(mu), amplitude=float(amp))
    except Exception:
        return None


# ---------- ANALYSIS ROUTINES ------------------------------------------------

def analyse_impulse_top(img: np.ndarray) -> Tuple[Optional[ProfileFit], Optional[GaussianFit], Optional[GaussianFit]]:
    """
    Given cropped grayscale image of a TOP impulse, estimate:
        - vertical falloff (ProfileFit)
        - horizontal spread near top (GaussianFit)
        - horizontal spread mid-plate (GaussianFit)
    """
    h, w = img.shape
    y_center, x_center = find_brightest_coord(img)

    # Vertical profile through brightest column
    col = img[:, x_center]
    vert_fit = fit_vertical_profile(col, from_top=True)

    # Horizontal profiles: near top (5% down) and mid-height
    y_top_slice = max(0, min(h - 1, int(0.05 * h)))
    y_mid_slice = max(0, min(h - 1, int(0.5 * h)))

    horiz_top = img[y_top_slice, :]
    horiz_mid = img[y_mid_slice, :]

    gauss_top = fit_horizontal_gaussian(horiz_top)
    gauss_mid = fit_horizontal_gaussian(horiz_mid)

    return vert_fit, gauss_top, gauss_mid


def analyse_impulse_bottom(img: np.ndarray) -> Tuple[Optional[ProfileFit], Optional[GaussianFit], Optional[GaussianFit]]:
    """
    Same as analyse_impulse_top but for bottom-origin light.
    Vertical profile is interpreted from bottom upwards.
    """
    h, w = img.shape
    y_center, x_center = find_brightest_coord(img)

    col = img[:, x_center]
    vert_fit = fit_vertical_profile(col, from_top=False)

    y_bottom_slice = max(0, min(h - 1, int(0.95 * h)))
    y_mid_slice = max(0, min(h - 1, int(0.5 * h)))

    horiz_bottom = img[y_bottom_slice, :]
    horiz_mid = img[y_mid_slice, :]

    gauss_bottom = fit_horizontal_gaussian(horiz_bottom)
    gauss_mid = fit_horizontal_gaussian(horiz_mid)

    return vert_fit, gauss_bottom, gauss_mid

def analyse_collision(top_img: np.ndarray, bottom_img: np.ndarray, coll_img: np.ndarray) -> Tuple[float, float]:
    """
    Estimate columnBoostStrength / columnBoostExponent by comparing
    mid-plate brightness in:
        - top impulse
        - bottom impulse
        - collision
    We assume the centre LED region is similar across images.
    """
    h, w = coll_img.shape
    # Define a vertical band around mid-plate
    y0 = int(0.4 * h)
    y1 = int(0.6 * h)

    def mid_band_mean(img: np.ndarray) -> float:
        band = img[y0:y1, :]
        return float(np.mean(band))

    top_mid = mid_band_mean(top_img)
    bottom_mid = mid_band_mean(bottom_img)
    coll_mid = mid_band_mean(coll_img)

    linear_sum = top_mid + bottom_mid + EPS
    # How much brighter is collision than linear sum?
    ratio = coll_mid / linear_sum

    # Map ratio into a reasonable boost strength/exponent space.
    # Heuristic: if ratio ~1.5 => modest boost; ~2.0+ => stronger.
    strength = max(0.0, min(5.0, (ratio - 1.0) * 2.5))  # rough scale
    exponent = 1.2 + max(0.0, (ratio - 1.0)) * 0.8      # 1.2–2.0 ish

    return strength, exponent

def analyse_edge_hotspots(img: np.ndarray) -> Tuple[float, float]:
    """
    Estimate edgeHotspotStrength and edgeHotspotWidth from the edges_only image.

    We compare average brightness at the far left/right vs centre.
    """
    h, w = img.shape
    # Vertical band that covers most of the bar
    y0 = int(0.2 * h)
    y1 = int(0.8 * h)

    # Horizontal regions: left edge, centre, right edge
    edge_width_frac = 0.1  # initial guess; we output this as edgeHotspotWidth
    ew = max(1, int(edge_width_frac * w))

    left_region = img[y0:y1, 0:ew]
    right_region = img[y0:y1, w - ew:w]
    centre_region = img[y0:y1, w // 3: 2 * w // 3]

    left_mean = float(np.mean(left_region))
    right_mean = float(np.mean(right_region))
    centre_mean = float(np.mean(centre_region))

    edge_mean = 0.5 * (left_mean + right_mean)
    centre_mean = max(centre_mean, EPS)

    ratio = edge_mean / centre_mean

    # If ratio ~1 => little hotspot; if ~2 => strong.
    strength = max(0.0, min(5.0, (ratio - 1.0) * 3.0))

    # Width: reuse our frac but clamp to a sane 0–0.25 range
    width = max(0.02, min(0.25, edge_width_frac))

    return strength, width


# ---------- MAPPING FITS TO SHADER PARAMS -----------------------------------

def map_optics(
    top_vert: Optional[ProfileFit],
    top_gauss_near: Optional[GaussianFit],
    top_gauss_far: Optional[GaussianFit],
    bottom_vert: Optional[ProfileFit],
    bottom_gauss_near: Optional[GaussianFit],
    bottom_gauss_far: Optional[GaussianFit],
    column_strength: float,
    column_exponent: float,
    edge_strength: float,
    edge_width: float,
) -> OpticsResult:
    """
    Take all fitted pieces and map them into shader uniform space.

    We assume shader uses:
        - uTopFalloff/uBottomFalloff ~ direct 'k' from exponential fits
        - uTopSpreadNear/Far ~ scaled versions of Gaussian sigma near/far
        - same for bottom.
    """

    # Reasonable defaults if fits fail
    DEFAULT = OpticsResult(
        topSpreadNear=0.003,
        topSpreadFar=0.02,
        bottomSpreadNear=0.008,
        bottomSpreadFar=0.03,
        topFalloff=3.0,
        bottomFalloff=2.0,
        columnBoostStrength=1.5,
        columnBoostExponent=1.2,
        edgeHotspotStrength=1.5,
        edgeHotspotWidth=0.08,
    )

    # Helper: convert Gaussian sigma (in normalised [0–1] image space) into shader spread.
    # Heuristic: direct mapping scaled by factor.
    def sigma_to_spread(sigma: Optional[float], scale: float, default: float) -> float:
        if sigma is None or sigma <= 0.0 or not math.isfinite(sigma):
            return default
        # sigma typically ~0.02–0.1, we map to a spread ~sigma*scale
        return max(0.0005, min(0.1, sigma * scale))

    # Falloff from fitted k; clamp to [0.5, 10]
    def k_to_falloff(fit: Optional[ProfileFit], default: float) -> float:
        if fit is None or not math.isfinite(fit.k) or fit.k <= 0.0:
            return default
        return float(max(0.5, min(10.0, fit.k)))

    top_falloff = k_to_falloff(top_vert, DEFAULT.topFalloff)
    bottom_falloff = k_to_falloff(bottom_vert, DEFAULT.bottomFalloff)

    top_sigma_near = top_gauss_near.sigma if top_gauss_near else None
    top_sigma_far = top_gauss_far.sigma if top_gauss_far else None
    bottom_sigma_near = bottom_gauss_near.sigma if bottom_gauss_near else None
    bottom_sigma_far = bottom_gauss_far.sigma if bottom_gauss_far else None

    top_spread_near = sigma_to_spread(top_sigma_near, scale=0.6, default=DEFAULT.topSpreadNear)
    top_spread_far = sigma_to_spread(top_sigma_far, scale=0.9, default=DEFAULT.topSpreadFar)
    bottom_spread_near = sigma_to_spread(bottom_sigma_near, scale=0.8, default=DEFAULT.bottomSpreadNear)
    bottom_spread_far = sigma_to_spread(bottom_sigma_far, scale=1.0, default=DEFAULT.bottomSpreadFar)

    # Column & edge parameters already in roughly the right range, clamp softly
    col_strength = float(max(0.0, min(5.0, column_strength)))
    col_exponent = float(max(0.5, min(3.0, column_exponent)))
    edge_strength_clamped = float(max(0.0, min(5.0, edge_strength)))
    edge_width_clamped = float(max(0.01, min(0.25, edge_width)))

    return OpticsResult(
        topSpreadNear=top_spread_near,
        topSpreadFar=top_spread_far,
        bottomSpreadNear=bottom_spread_near,
        bottomSpreadFar=bottom_spread_far,
        topFalloff=top_falloff,
        bottomFalloff=bottom_falloff,
        columnBoostStrength=col_strength,
        columnBoostExponent=col_exponent,
        edgeHotspotStrength=edge_strength_clamped,
        edgeHotspotWidth=edge_width_clamped,
    )


# ---------- MAIN -------------------------------------------------------------

def main():
    print("=== K1 Optics Calibration ===")
    print(f"Calibration directory: {CAL_DIR}")

    # 1) Load & crop images
    top_img_full = load_gray(TOP_IMPULSE_PATH)
    bottom_img_full = load_gray(BOTTOM_IMPULSE_PATH)
    coll_img_full = load_gray(COLLISION_PATH)
    edges_img_full = load_gray(EDGES_ONLY_PATH)

    top_img = crop_roi(top_img_full)
    bottom_img = crop_roi(bottom_img_full)
    coll_img = crop_roi(coll_img_full)
    edges_img = crop_roi(edges_img_full)

    # 2) Analyse impulse responses
    top_vert, top_gauss_near, top_gauss_mid = analyse_impulse_top(top_img)
    bottom_vert, bottom_gauss_near, bottom_gauss_mid = analyse_impulse_bottom(bottom_img)

    # Use mid Gaussian as "far" spread
    top_gauss_far = top_gauss_mid
    bottom_gauss_far = bottom_gauss_mid

    # 3) Collision-based column boost
    col_strength, col_exponent = analyse_collision(top_img, bottom_img, coll_img)

    # 4) Edge hotspots
    edge_strength, edge_width = analyse_edge_hotspots(edges_img)

    # 5) Map into shader params
    optics = map_optics(
        top_vert=top_vert,
        top_gauss_near=top_gauss_near,
        top_gauss_far=top_gauss_far,
        bottom_vert=bottom_vert,
        bottom_gauss_near=bottom_gauss_near,
        bottom_gauss_far=bottom_gauss_far,
        column_strength=col_strength,
        column_exponent=col_exponent,
        edge_strength=edge_strength,
        edge_width=edge_width,
    )

    # 6) Print JSON block to paste into K1_HERO_PRESET.optics
    print("\nSuggested optics block for K1_HERO_PRESET (K1Engine.tsx):\n")
    optics_dict = {
        "topSpreadNear": optics.topSpreadNear,
        "topSpreadFar": optics.topSpreadFar,
        "bottomSpreadNear": optics.bottomSpreadNear,
        "bottomSpreadFar": optics.bottomSpreadFar,
        "topFalloff": optics.topFalloff,
        "bottomFalloff": optics.bottomFalloff,
        "columnBoostStrength": optics.columnBoostStrength,
        "columnBoostExponent": optics.columnBoostExponent,
        "edgeHotspotStrength": optics.edgeHotspotStrength,
        "edgeHotspotWidth": optics.edgeHotspotWidth,
    }
    print(json.dumps(optics_dict, indent=2))
    print("\nPaste this into your K1_HERO_PRESET.optics and tweak if needed.\n")


if __name__ == "__main__":
    main()
