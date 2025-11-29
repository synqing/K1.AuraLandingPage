"""
K1-Lightwave Asset Generation - Blender Automation Script
===========================================================

This script automatically sets up cameras and lighting for all 5 categories of renders.
Run this in Blender after importing your K1 3D model.

PREREQUISITES:
1. Open Blender
2. Import your K1 model (File > Import > your format)
3. Select your K1 model in the scene
4. Open Blender's Scripting workspace
5. Create new text block and paste this entire script
6. Click "Run Script"

The script will create 5 camera setups and lighting rigs, one for each render category.
"""

import bpy
import math

# Configuration - adjust these if your model has different dimensions
DEVICE_CENTER = (0, 0, 0)  # Assuming K1 model is centered at origin
DEVICE_LENGTH = 0.32  # 32cm in meters
DEVICE_WIDTH = 0.054  # 54mm in meters

def clear_scene_cameras_lights():
    """Remove existing cameras and lights to start fresh"""
    for obj in bpy.data.objects:
        if obj.type in ['CAMERA', 'LIGHT']:
            bpy.data.objects.remove(obj, do_unlink=True)
    print("Cleared existing cameras and lights")

def create_camera(name, location, rotation, lens=50):
    """Helper function to create and configure a camera"""
    cam_data = bpy.data.cameras.new(name=name)
    cam_data.lens = lens
    cam_obj = bpy.data.objects.new(name, cam_data)
    bpy.context.collection.objects.link(cam_obj)
    cam_obj.location = location
    cam_obj.rotation_euler = rotation
    return cam_obj

def create_light(name, light_type, location, energy, color=(1, 1, 1)):
    """Helper function to create and configure a light"""
    light_data = bpy.data.lights.new(name=name, type=light_type)
    light_data.energy = energy
    light_data.color = color
    light_obj = bpy.data.objects.new(name, light_data)
    bpy.context.collection.objects.link(light_obj)
    light_obj.location = location
    # Point light at device center
    direction = tuple(DEVICE_CENTER[i] - location[i] for i in range(3))
    light_obj.rotation_euler = (0, 0, 0)  # Will be properly oriented by track_to below
    return light_obj

def add_track_to_constraint(obj, target_location):
    """Make object point toward target location"""
    # Create empty at device center if it doesn't exist
    if "DeviceCenter" not in bpy.data.objects:
        empty = bpy.data.objects.new("DeviceCenter", None)
        bpy.context.collection.objects.link(empty)
        empty.location = target_location
    else:
        empty = bpy.data.objects["DeviceCenter"]
    
    constraint = obj.constraints.new(type='TRACK_TO')
    constraint.target = empty
    constraint.track_axis = 'TRACK_NEGATIVE_Z'
    constraint.up_axis = 'UP_Y'

# ============================================================================
# CATEGORY 1: HERO ROTATION SETUP
# ============================================================================
def setup_category_1_hero_rotation():
    """
    Creates camera at 3/4 view, elevated 15 degrees
    Adds key light upper right and rim light behind
    """
    print("\n=== Setting up Category 1: Hero Rotation ===")
    
    # Camera position: 50cm from device, 15 degrees elevation, 45 degrees horizontal angle
    distance = 0.5
    elevation_rad = math.radians(15)
    angle_rad = math.radians(45)
    
    cam_x = distance * math.cos(elevation_rad) * math.cos(angle_rad)
    cam_y = -distance * math.cos(elevation_rad) * math.sin(angle_rad)
    cam_z = distance * math.sin(elevation_rad)
    
    cam = create_camera(
        name="CAT1_HeroRotation_Camera",
        location=(cam_x, cam_y, cam_z),
        rotation=(elevation_rad, 0, angle_rad + math.pi/2),
        lens=50
    )
    add_track_to_constraint(cam, DEVICE_CENTER)
    
    # Key light: upper right, intensity 0.8 (800W equivalent)
    key_light = create_light(
        name="CAT1_KeyLight",
        light_type='AREA',
        location=(0.4, -0.3, 0.5),
        energy=800
    )
    add_track_to_constraint(key_light, DEVICE_CENTER)
    
    # Rim light: behind device, intensity 0.4 (400W equivalent)  
    rim_light = create_light(
        name="CAT1_RimLight",
        light_type='AREA',
        location=(-0.3, 0, 0.3),
        energy=400
    )
    add_track_to_constraint(rim_light, DEVICE_CENTER)
    
    print("✓ Category 1 setup complete")
    print(f"  Camera: {cam.name} at {cam.location}")
    print("  Render 30 frames rotating device 12 degrees per frame")

# ============================================================================
# CATEGORY 2: EDGE DETAIL CLOSEUPS
# ============================================================================
def setup_category_2_edge_closeups():
    """
    Creates 4 cameras positioned close to each edge
    Adds grazing side lighting
    """
    print("\n=== Setting up Category 2: Edge Detail Closeups ===")
    
    close_distance = 0.1  # 10cm from edge
    
    # Left edge camera
    cam_left = create_camera(
        name="CAT2_EdgeLeft_Camera",
        location=(-DEVICE_LENGTH/2 - close_distance, 0, 0.05),
        rotation=(math.radians(90), 0, math.radians(90)),
        lens=85  # Longer lens for macro effect
    )
    
    # Right edge camera  
    cam_right = create_camera(
        name="CAT2_EdgeRight_Camera",
        location=(DEVICE_LENGTH/2 + close_distance, 0, 0.05),
        rotation=(math.radians(90), 0, math.radians(-90)),
        lens=85
    )
    
    # Top detail camera
    cam_top = create_camera(
        name="CAT2_EdgeTop_Camera",
        location=(0, 0, DEVICE_WIDTH/2 + close_distance),
        rotation=(0, 0, 0),
        lens=85
    )
    
    # Bottom detail camera
    cam_bottom = create_camera(
        name="CAT2_EdgeBottom_Camera",
        location=(0, 0, -DEVICE_WIDTH/2 - close_distance),
        rotation=(math.radians(180), 0, 0),
        lens=85
    )
    
    # Grazing side light (intensity 0.9 = 900W)
    edge_light = create_light(
        name="CAT2_GrazingLight",
        light_type='AREA',
        location=(0, -0.15, 0.05),
        energy=900
    )
    add_track_to_constraint(edge_light, DEVICE_CENTER)
    
    print("✓ Category 2 setup complete")
    print("  Created 4 edge-focused cameras with macro lens")
    print("  Render each camera separately for 4 closeup views")

# ============================================================================
# CATEGORY 3: CONTEXT SCALE (DESK ENVIRONMENT)
# ============================================================================
def setup_category_3_context_scale():
    """
    Creates cameras for desk environment views
    Adds ambient room lighting + warm desk lamp
    """
    print("\n=== Setting up Category 3: Context Scale ===")
    
    # Front view (user POV)
    cam_front = create_camera(
        name="CAT3_DeskFront_Camera",
        location=(0, -0.6, 0.15),
        rotation=(math.radians(80), 0, 0),
        lens=35  # Wider lens for environment context
    )
    add_track_to_constraint(cam_front, DEVICE_CENTER)
    
    # 45-degree angle view
    cam_angle = create_camera(
        name="CAT3_DeskAngle_Camera",
        location=(0.4, -0.5, 0.2),
        rotation=(math.radians(75), 0, math.radians(40)),
        lens=35
    )
    add_track_to_constraint(cam_angle, DEVICE_CENTER)
    
    # Top-down view
    cam_top = create_camera(
        name="CAT3_DeskTop_Camera",
        location=(0, 0, 0.8),
        rotation=(0, 0, 0),
        lens=50
    )
    add_track_to_constraint(cam_top, DEVICE_CENTER)
    
    # Ambient room light (low intensity, cool temp)
    ambient = create_light(
        name="CAT3_AmbientRoom",
        light_type='SUN',
        location=(0, 0, 1),
        energy=50,
        color=(0.9, 0.95, 1.0)  # Slightly cool
    )
    
    # Warm desk lamp (tungsten color temp ~3200K)
    desk_lamp = create_light(
        name="CAT3_DeskLamp",
        light_type='AREA',
        location=(-0.4, -0.3, 0.4),
        energy=600,
        color=(1.0, 0.8, 0.6)  # Warm tungsten
    )
    add_track_to_constraint(desk_lamp, DEVICE_CENTER)
    
    print("✓ Category 3 setup complete")
    print("  NOTE: You'll need to add desk props (keyboard, mouse, etc) manually")
    print("  Render from each of the 3 cameras with props in scene")

# ============================================================================
# CATEGORY 4: LIGHT-READY DARK BACKGROUNDS
# ============================================================================
def setup_category_4_light_ready_dark():
    """
    Creates cameras with minimal rim lighting on pure black background
    This is for AI to add LED glowing effects later
    """
    print("\n=== Setting up Category 4: Light-Ready Dark ===")
    
    # Front-facing view
    cam_front = create_camera(
        name="CAT4_DarkFront_Camera",
        location=(0, -0.5, 0),
        rotation=(math.radians(90), 0, 0),
        lens=50
    )
    add_track_to_constraint(cam_front, DEVICE_CENTER)
    
    # 3/4 view (main hero angle)
    cam_three_quarter = create_camera(
        name="CAT4_DarkThreeQuarter_Camera",
        location=(0.35, -0.35, 0.1),
        rotation=(math.radians(85), 0, math.radians(45)),
        lens=50
    )
    add_track_to_constraint(cam_three_quarter, DEVICE_CENTER)
    
    # Pure side profile
    cam_side = create_camera(
        name="CAT4_DarkSide_Camera",
        location=(-0.5, 0, 0),
        rotation=(math.radians(90), 0, math.radians(90)),
        lens=50
    )
    add_track_to_constraint(cam_side, DEVICE_CENTER)
    
    # Minimal rim light (intensity 0.3 = 300W) - just enough to define edges
    rim = create_light(
        name="CAT4_MinimalRim",
        light_type='AREA',
        location=(-0.2, 0.1, 0.2),
        energy=300
    )
    add_track_to_constraint(rim, DEVICE_CENTER)
    
    # Set world background to pure black
    bpy.context.scene.world.use_nodes = True
    bg_node = bpy.context.scene.world.node_tree.nodes["Background"]
    bg_node.inputs[0].default_value = (0, 0, 0, 1)  # Pure black RGBA
    bg_node.inputs[1].default_value = 0  # Zero strength
    
    print("✓ Category 4 setup complete")
    print("  World background set to pure black")
    print("  Device will be mostly silhouette - perfect for AI light animation")

# ============================================================================
# CATEGORY 5: MATERIAL DETAIL MACRO
# ============================================================================
def setup_category_5_material_macro():
    """
    Creates extreme closeup cameras for material details
    Adds close-range directional lighting
    """
    print("\n=== Setting up Category 5: Material Macro ===")
    
    macro_distance = 0.03  # 3cm from surface
    
    # Aluminum housing texture macro
    cam_aluminum = create_camera(
        name="CAT5_MacroAluminum_Camera",
        location=(DEVICE_LENGTH/4, -macro_distance, 0.02),
        rotation=(math.radians(85), 0, 0),
        lens=100  # Very long lens for extreme macro
    )
    
    # Light guide plate edge macro (showing transparency)
    cam_acrylic = create_camera(
        name="CAT5_MacroAcrylic_Camera",
        location=(0, -macro_distance, DEVICE_WIDTH/2),
        rotation=(math.radians(75), 0, 0),
        lens=100
    )
    
    # Corner detail/seam macro
    cam_corner = create_camera(
        name="CAT5_MacroCorner_Camera",
        location=(DEVICE_LENGTH/2 - 0.02, -macro_distance, 0.02),
        rotation=(math.radians(80), 0, math.radians(-15)),
        lens=100
    )
    
    # Close directional light for texture reveal
    macro_light = create_light(
        name="CAT5_MacroLight",
        light_type='SPOT',
        location=(0, -0.05, 0.08),
        energy=500
    )
    add_track_to_constraint(macro_light, DEVICE_CENTER)
    
    print("✓ Category 5 setup complete")
    print("  Created 3 extreme macro cameras (add more manually if needed)")
    print("  Use 100mm equivalent lens for shallow depth of field effect")

# ============================================================================
# MAIN EXECUTION
# ============================================================================
def main():
    """Run all setup functions"""
    print("\n" + "="*60)
    print("K1-Lightwave Blender Setup - Starting Automation")
    print("="*60)
    
    # Clear existing cameras and lights
    clear_scene_cameras_lights()
    
    # Setup all 5 categories
    setup_category_1_hero_rotation()
    setup_category_2_edge_closeups()
    setup_category_3_context_scale()
    setup_category_4_light_ready_dark()
    setup_category_5_material_macro()
    
    print("\n" + "="*60)
    print("SETUP COMPLETE!")
    print("="*60)
    print("\nNEXT STEPS:")
    print("1. Select camera in outliner (e.g., CAT1_HeroRotation_Camera)")
    print("2. Set as active camera: View > Cameras > Set Active Camera")
    print("3. Configure render settings (resolution 1920x1080, format PNG)")
    print("4. Render image or animation")
    print("5. Repeat for each category's cameras")
    print("\nTIP: Use Blender's Camera Switcher addon to quickly change between cameras")
    print("\n" + "="*60)

# Run the script
if __name__ == "__main__":
    main()