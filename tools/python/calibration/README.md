# K1 Optics Calibration Tool

This tool analyzes photographs of the K1 hardware to generate physically accurate parameters for the K1 Visual Engine.

## Setup

1.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Usage

1.  Capture 4 calibration photos of the K1 unit in a dark room:
    *   `top_impulse_center.jpg`: Only the top LEDs lit (center impulse).
    *   `bottom_impulse_center.jpg`: Only the bottom LEDs lit (center impulse).
    *   `collision_center.jpg`: Both top and bottom LEDs lit (center impulse).
    *   `edges_only.jpg`: LEDs at the far left/right edges lit.

2.  Place these images in the `cal/` directory:
    ```bash
    tools/python/calibration/cal/
    ```

3.  Run the script:
    ```bash
    python calibrate_optics.py
    ```

4.  Copy the JSON output and paste it into `K1_HERO_PRESET.optics` in `apps/web-main/app/engine/K1Engine.tsx`.
