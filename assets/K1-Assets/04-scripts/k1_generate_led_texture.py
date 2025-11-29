"""
K1 Lightwave - LED Texture Generation Script
Uses AI-Render addon to create realistic LED textures for the light guide plate

Based on: Hardware specs - 320 RGB LEDs (160 per edge), dual edge-lit design
Addon: AI-Render with StableHorde API (1000 free requests)

USAGE:
1. Ensure AI-Render addon is enabled
2. Open K1_Final.blend
3. Copy this script to Blender's Scripting workspace
4. Run the script (Alt+P or click Run)
5. Wait 30-60 seconds for AI texture generation
"""

import bpy
import math

def create_led_texture_material(name, preset="fire"):
    """
    Create material with AI-generated LED texture

    Presets based on K1 firmware palettes:
    - fire: Orange/red glow (warm, energetic)
    - ocean: Blue/cyan gradient (cool, calm)
    - neon: Pink/purple/blue (vibrant, electric)
    - white: Clean white with slight blue tint (professional)
    """

    # AI-Render prompts optimized for LED visualization
    prompts = {
        "fire": "320 individual RGB LED pixels in a line, orange to red gradient, soft glow effect, professional product photography lighting, 4K resolution, slight bloom, warm color temperature",
        "ocean": "320 individual RGB LED pixels in a line, deep blue to cyan gradient, soft glow effect, professional product photography lighting, 4K resolution, slight bloom, cool color temperature",
        "neon": "320 individual RGB LED pixels in a line, pink to purple to blue gradient, vibrant neon glow effect, professional product photography lighting, 4K resolution, strong bloom, electric aesthetic",
        "white": "320 individual RGB LED pixels in a line, clean white with slight blue tint, soft uniform glow, professional product photography lighting, 4K resolution, minimal bloom, neutral color temperature",
        "dual_edge": "320 RGB LED pixels, dual light source from both edges, even diffusion across acrylic light guide plate, no hotspots, professional lighting, 4K resolution, symmetrical glow",
        "reactive": "320 RGB LED pixels responding to music, bass-reactive pattern, dynamic color shifts, blue to pink gradient, pulsing glow effect, professional photography lighting, 4K resolution"
    }

    prompt = prompts.get(preset, prompts["fire"])

    print(f"\n🎨 Generating LED Texture: {name}")
    print(f"   Preset: {preset}")
    print(f"   Prompt: {prompt[:80]}...")

    # Create new material
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Clear default nodes
    nodes.clear()

    # Add Material Output
    output_node = nodes.new('ShaderNodeOutputMaterial')
    output_node.location = (400, 0)

    # Add Emission shader (LEDs emit light)
    emission_node = nodes.new('ShaderNodeEmission')
    emission_node.location = (200, 0)
    emission_node.inputs['Strength'].default_value = 2.0  # LED brightness

    # Add AI-Render texture node
    # NOTE: You'll need to manually trigger AI-Render generation
    # This script sets up the material structure
    image_tex_node = nodes.new('ShaderNodeTexImage')
    image_tex_node.location = (0, 0)
    image_tex_node.label = "AI_RENDER_HERE"

    # Link nodes
    links.new(image_tex_node.outputs['Color'], emission_node.inputs['Color'])
    links.new(emission_node.outputs['Emission'], output_node.inputs['Surface'])

    print(f"   ✓ Material created: {name}")
    print(f"   ⚠️  NEXT STEP: Manually generate AI texture")

    return mat

def setup_led_materials():
    """Create all LED texture materials for different firmware presets"""

    print("\n💡 K1 LIGHTWAVE - LED TEXTURE SETUP")
    print("=" * 60)

    materials = []

    # Create materials for each preset
    presets = [
        ("K1_LED_Fire", "fire"),
        ("K1_LED_Ocean", "ocean"),
        ("K1_LED_Neon", "neon"),
        ("K1_LED_White", "white"),
        ("K1_LED_DualEdge", "dual_edge"),
        ("K1_LED_Reactive", "reactive")
    ]

    for mat_name, preset in presets:
        mat = create_led_texture_material(mat_name, preset)
        materials.append(mat)

    print("\n" + "=" * 60)
    print(f"✅ Created {len(materials)} LED materials")
    print("\n📋 MANUAL STEPS REQUIRED (AI-Render):")
    print("=" * 60)
    print("\nFor EACH material created above:")
    print("1. Select the material in Shader Editor")
    print("2. Select the 'AI_RENDER_HERE' Image Texture node")
    print("3. In the AI-Render panel (right sidebar):")
    print("   • Click 'Generate' button")
    print("   • Wait 30-60 seconds for generation")
    print("   • Image will appear in the texture node")
    print("4. Repeat for next material")
    print("\n💡 TIP: Start with K1_LED_Fire (hero shot primary)")
    print("=" * 60)

    return materials

def create_led_plane_with_texture(material_name="K1_LED_Fire"):
    """
    Create a plane representing the LED strip with the generated texture
    Useful for testing texture quality before applying to main K1 model
    """

    # Create plane (32cm x 1cm to represent LED strip)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
    plane = bpy.context.active_object
    plane.name = "LED_Preview_Plane"
    plane.scale = (0.32, 0.01, 1)  # 32cm x 1cm

    # Apply material if it exists
    if material_name in bpy.data.materials:
        mat = bpy.data.materials[material_name]
        if plane.data.materials:
            plane.data.materials[0] = mat
        else:
            plane.data.materials.append(mat)
        print(f"\n✓ Created preview plane with {material_name}")
    else:
        print(f"\n⚠️  Material {material_name} not found - create materials first")

    return plane

def apply_led_texture_to_k1(material_name="K1_LED_Fire", object_name="FINAL_K1"):
    """
    Apply generated LED texture to the K1 light guide plate

    Args:
        material_name: Name of the LED material to apply
        object_name: Name of the K1 mesh object (default: FINAL_K1)
    """

    # Find K1 object
    if object_name not in bpy.data.objects:
        print(f"❌ Object '{object_name}' not found in scene")
        print(f"   Available objects: {[obj.name for obj in bpy.data.objects if obj.type == 'MESH']}")
        return None

    k1_object = bpy.data.objects[object_name]

    # Find material
    if material_name not in bpy.data.materials:
        print(f"❌ Material '{material_name}' not found")
        print(f"   Available LED materials: {[mat.name for mat in bpy.data.materials if mat.name.startswith('K1_LED_')]}")
        return None

    mat = bpy.data.materials[material_name]

    # Apply material to light guide plate
    # Assuming K1 has material slots already
    if k1_object.data.materials:
        # Replace first material (light guide plate)
        k1_object.data.materials[0] = mat
    else:
        k1_object.data.materials.append(mat)

    print(f"\n✅ Applied {material_name} to {object_name}")
    print(f"   Material slot: 0 (Light Guide Plate)")

    return k1_object

# Execute setup
if __name__ == "__main__":
    # Create all LED materials
    materials = setup_led_materials()

    print("\n\n🎯 WORKFLOW SUMMARY:")
    print("=" * 60)
    print("STEP 1: Generate textures in AI-Render (30-60 sec each)")
    print("STEP 2: Test on preview plane:")
    print("        >>> create_led_plane_with_texture('K1_LED_Fire')")
    print("STEP 3: Apply to K1 model:")
    print("        >>> apply_led_texture_to_k1('K1_LED_Fire', 'FINAL_K1')")
    print("STEP 4: Render test shot (F12)")
    print("=" * 60)

    print("\n💡 QUICK START:")
    print("After generating AI textures, run this in console:")
    print(">>> apply_led_texture_to_k1('K1_LED_Fire', 'FINAL_K1')")
