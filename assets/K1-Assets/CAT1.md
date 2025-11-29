# Category 1: Hero Rotation Video Generation Prompt

## Seed Images Required
All 30 rotation frames from `/01-keyshot-seeds/cat1-hero-rotations/`
Upload as image sequence (frames 001-030)

## Primary Prompt for AI Video Generation

"Smooth 360-degree rotation of precision-engineered hardware lighting device on black studio background, camera locked to device center maintaining constant distance and elevation, subtle volumetric lighting with fine dust particles floating in light beams, metallic surface catching and reflecting key light as device rotates creating natural specular highlights that shift across aluminum housing, no geometry changes to device itself, maintain exact material properties of brushed aluminum and transparent acrylic components, add subtle atmospheric depth through light falloff but keep background pure black, interpolate smoothly between provided rotation frames with no temporal artifacts or judder, 10 seconds duration at 24fps, cinematic color grading with slight desaturation emphasizing technical precision over consumer appeal"

## Technical Parameters
- Duration: 10 seconds
- Frame rate: 24fps  
- Resolution: 1920x1080
- Output format: MP4 (H.264)

## Alternative Prompt Variations

### Variation A (More Dramatic Lighting):
"Same rotation as primary but add subtle rim light from behind device creating separation from background, increase key light intensity slightly to create more pronounced shadows defining dual-edge architecture, add lens flare effect when metal surfaces catch light at specific rotation angles"

### Variation B (Minimalist Clean):
"Same rotation as primary but remove all atmospheric effects like dust particles, keep lighting flat and even with no dramatic shadows, emphasize geometric perfection and material quality through clean presentation, slightly cooler color temperature for technical aesthetic"

### Variation C (With Light Bleed Hint):
"Same rotation as primary but add subtle glow along top and bottom edges of device suggesting LED illumination beginning to activate, glow should be barely visible - just a hint of cyan and amber light bleeding through transparent edges, maintain darkness otherwise"

## What To Watch For In Generated Output
- Check that device geometry doesn't morph or distort during rotation
- Verify background stays pure black without AI adding unwanted textures
- Confirm rotation is smooth without speed changes or stuttering
- Look for any hallucinated details AI might add (extra ports, changed branding, etc.)
- Ensure material properties remain consistent throughout - aluminum stays metallic, acrylic stays transparent

## If Output Is Unsatisfactory
1. First try different prompt variation (A, B, or C above)
2. If geometry is morphing, reduce number of seed frames to every 24 degrees instead of every 12 degrees (15 frames total instead of 30)
3. If background isn't staying black, add "maintain pure black background RGB 0,0,0" to prompt
4. If rotation is jerky, specify "use optical flow interpolation for smooth motion between frames"

## Best Use Case On Landing Page
This video works best as:
- Secondary hero option if Category 4 light show is too abstract
- Background element in technical specs section showing device from all angles
- Supporting video in "What Makes K1 Different" bento grid area