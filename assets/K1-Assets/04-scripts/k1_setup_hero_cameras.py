"""
K1 Lightwave - Hero Camera Setup Script
Creates 10 camera angles optimized for landing page hero shots

Based on: docs/04-planning/K1-LP.Plan_ASSET_PRODUCTION_v1.0_20251110.md
Hardware specs: 32cm light guide plate, dual edge-lit design

USAGE:
1. Open K1_Final.blend
2. Copy this entire script to Blender's Scripting workspace
3. Run the script (Alt+P or click Run)
4. Cameras will be created and positioned automatically
"""

import bpy
import math
from mathutils import Vector, Euler

def clear_existing_hero_cameras():
    """Remove any existing HERO_* cameras to start fresh"""
    cameras_to_remove = [obj for obj in bpy.data.objects if obj.name.startswith("HERO_")]
    for cam in cameras_to_remove:
        bpy.data.objects.remove(cam, do_unlink=True)
    print(f"✓ Cleared {len(cameras_to_remove)} existing hero cameras")

def create_camera(name, location, rotation, focal_length=35):
    """Create and configure a camera with given parameters"""
    # Create camera data and object
    cam_data = bpy.data.cameras.new(name=name)
    cam_data.lens = focal_length
    cam_data.sensor_width = 36  # Full frame sensor

    cam_object = bpy.data.objects.new(name, cam_data)
    bpy.context.collection.objects.link(cam_object)

    # Set position and rotation
    cam_object.location = location
    cam_object.rotation_euler = rotation

    return cam_object

def setup_hero_cameras():
    """
    Create 10 hero camera angles for K1 landing page

    Camera naming: HERO_##_Description_Camera
    Angles optimized to show:
    - Dual edge-lit design (CRITICAL differentiator)
    - 320 LED density
    - Premium build quality
    - Size/scale context
    """

    print("\n🎬 K1 LIGHTWAVE - HERO CAMERA SETUP")
    print("=" * 50)

    # Clear any existing hero cameras
    clear_existing_hero_cameras()

    # Define camera positions (x, y, z) and rotations (rx, ry, rz in radians)
    # K1 is 32cm wide, positioned at origin

    cameras = [
        {
            "name": "HERO_01_ThreeQuarter_Camera",
            "desc": "Main hero angle - 3/4 view showing depth and dual edges",
            "location": Vector((0.5, -0.6, 0.3)),
            "rotation": Euler((math.radians(70), 0, math.radians(40)), 'XYZ'),
            "focal": 50,
            "priority": "★★★ Primary hero shot"
        },
        {
            "name": "HERO_02_Front_Camera",
            "desc": "Straight-on view showing LED density and symmetry",
            "location": Vector((0, -0.7, 0.15)),
            "rotation": Euler((math.radians(80), 0, 0), 'XYZ'),
            "focal": 35,
            "priority": "★★★ Hero alternative"
        },
        {
            "name": "HERO_03_SideDetail_Camera",
            "desc": "Edge profile showing light guide plate thickness",
            "location": Vector((0.6, -0.2, 0.2)),
            "rotation": Euler((math.radians(75), 0, math.radians(85)), 'XYZ'),
            "focal": 85,
            "priority": "★★★ Differentiator shot (dual edge-lit)"
        },
        {
            "name": "HERO_04_LowAngle_Camera",
            "desc": "Dramatic low angle emphasizing premium build",
            "location": Vector((0.4, -0.5, 0.05)),
            "rotation": Euler((math.radians(85), 0, math.radians(30)), 'XYZ'),
            "focal": 35,
            "priority": "★★ Emotional appeal"
        },
        {
            "name": "HERO_05_TopDown_Camera",
            "desc": "Overhead view showing full 32cm width and LED layout",
            "location": Vector((0, 0, 1.0)),
            "rotation": Euler((0, 0, 0), 'XYZ'),
            "focal": 50,
            "priority": "★★ Technical view"
        },
        {
            "name": "HERO_06_CloseupEdge_Camera",
            "desc": "Macro shot of LED edge showing individual pixels",
            "location": Vector((0.2, -0.3, 0.15)),
            "rotation": Euler((math.radians(75), 0, math.radians(20)), 'XYZ'),
            "focal": 100,
            "priority": "★★ Quality detail"
        },
        {
            "name": "HERO_07_ContextDesk_Camera",
            "desc": "Medium shot showing K1 in desk setup context",
            "location": Vector((0.8, -1.2, 0.4)),
            "rotation": Euler((math.radians(65), 0, math.radians(35)), 'XYZ'),
            "focal": 35,
            "priority": "★★ Lifestyle context"
        },
        {
            "name": "HERO_08_BacklitSilhouette_Camera",
            "desc": "Backlit shot emphasizing light diffusion through plate",
            "location": Vector((0, 0.5, 0.2)),
            "rotation": Euler((math.radians(80), 0, math.radians(180)), 'XYZ'),
            "focal": 50,
            "priority": "★ Artistic shot"
        },
        {
            "name": "HERO_09_HighAngle_Camera",
            "desc": "High angle showing USB-C connection and mounting",
            "location": Vector((0.3, -0.5, 0.5)),
            "rotation": Euler((math.radians(55), 0, math.radians(25)), 'XYZ'),
            "focal": 50,
            "priority": "★ Feature detail"
        },
        {
            "name": "HERO_10_DramaticSide_Camera",
            "desc": "Extreme side angle for dramatic lighting reveal",
            "location": Vector((0.7, -0.1, 0.18)),
            "rotation": Euler((math.radians(78), 0, math.radians(88)), 'XYZ'),
            "focal": 85,
            "priority": "★ Motion graphics option"
        }
    ]

    # Create all cameras
    created_cameras = []
    for i, cam_config in enumerate(cameras, 1):
        cam = create_camera(
            name=cam_config["name"],
            location=cam_config["location"],
            rotation=cam_config["rotation"],
            focal_length=cam_config["focal"]
        )
        created_cameras.append(cam)

        print(f"\n{i:02d}. {cam_config['name']}")
        print(f"    📝 {cam_config['desc']}")
        print(f"    🎯 {cam_config['priority']}")
        print(f"    📍 Location: {cam_config['location']}")
        print(f"    🔄 Focal: {cam_config['focal']}mm")

    # Set HERO_01 as active camera (primary hero shot)
    bpy.context.scene.camera = created_cameras[0]

    print("\n" + "=" * 50)
    print(f"✅ Created {len(created_cameras)} hero cameras")
    print(f"📷 Active camera: {created_cameras[0].name}")
    print("\n🎬 NEXT STEPS:")
    print("1. Select camera from Scene Collection")
    print("2. Press Numpad 0 to view through camera")
    print("3. Press F12 to test render")
    print("4. Adjust positions if needed")
    print("=" * 50)

    return created_cameras

# Execute the setup
if __name__ == "__main__":
    setup_hero_cameras()
