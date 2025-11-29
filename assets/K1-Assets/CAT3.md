# Category 3: Context Scale / Desk Environment Video Prompt

## Seed Image Required
`k1-desk-angle.png` from `/01-keyshot-seeds/cat3-context-scale/`

## Primary Prompt

"Slow controlled camera push-in on precision LED lighting device positioned naturally on studio workspace desk environment, K1-Lightwave sits centered in frame with mechanical keyboard visible in soft-focus foreground and edge of monitor stand visible in background creating natural depth layering, camera begins 80cm from desk surface and slowly dollies forward to 50cm over 8 seconds maintaining slight downward angle typical of seated user perspective, shallow depth of field with device in sharp focus while desk elements gradually blur creating professional product photography aesthetic, warm tungsten desk lamp positioned off-camera left creating soft directional key light that pools on desk surface around device, subtle hand shadow passes briefly across right side of desk at 3 second mark suggesting user presence without showing hands or person, aluminum housing of device catches warm lamp light creating natural specular highlights, acrylic light guide plate shows subtle internal refraction patterns but no active LED glow in this shot, maintain photorealistic material accuracy with no oversaturation, add very subtle film grain texture to entire frame for organic analog feel not sterile digital rendering, color grade toward slightly warm tones around 3200K suggesting late evening studio session, no device movement only camera movement, desk surface should be clean dark gray or matte black material, overall mood is focused professional workspace not consumer bedroom setup"

## Technical Parameters
- Duration: 8 seconds
- Frame rate: 24fps
- Resolution: 1920x1080  
- Output format: MP4 (H.264)

## Variation Prompts

### Variation A (Tighter Focus, Less Environment):
"Same as primary but camera starts closer and ends very close to device, desk elements more out of focus emphasizing device itself, remove hand shadow pass, increase depth of field slightly so entire device stays sharp including both front and back edges"

### Variation B (Slight Pan Instead Of Push):
"Camera positioned at fixed distance but executes slow horizontal pan from left to right revealing device in stages, starts with just left edge of device in frame and ends with full device visible plus some right-side environment context, maintain same shallow depth of field and warm lighting"

### Variation C (Top-Down With Scale Reveal):
"Camera positioned directly overhead looking down at desk, K1-Lightwave shown in context with full keyboard and mouse visible demonstrating actual size relationships, no camera movement just static locked-off shot emphasizing clean geometric composition, increase lighting to bright even studio illumination removing warm desk lamp mood"

## Critical Success Criteria

This video must accomplish:
1. Make the device feel REAL and PHYSICAL not rendered or abstract
2. Show actual size/scale in context with familiar objects (keyboard reference)
3. Create emotional association with focused creative work environment  
4. Ground the product in the specific use case (desk setups, not wall mounting or ceiling installation)
5. Suggest premium professional tool rather than consumer gadget through environmental cues

## What To Watch For

- Device maintaining exact geometry (AI sometimes morphs objects during camera movement)
- Keyboard and desk props looking realistic not overly synthetic
- Depth of field being natural and optical not artificially applied
- Hand shadow (if included) looking like natural shadow not composited element
- Lighting feeling like real tungsten source not CG approximation
- Overall scene feeling like a photo/video of real objects not 3D render

## If Output Isn't Working

### Problem: Everything looks too CG/rendered
Solution: Add "increase physical material imperfections, add subtle dust on desk surface, slight fingerprint smudges on device housing, tiny scratches on aluminum from normal handling, make environment feel lived-in not showroom pristine"

### Problem: Device looks fake compared to desk props
Solution: Ensure your seed image render from KeyShot/Blender has matching lighting and material quality as desk prop references, try using a photograph of an actual desk as background layer and composite device on top

### Problem: Camera movement feels unnatural or robotic
Solution: Add "camera movement shows subtle human operator micro-movements, not perfectly smooth robotic dolly, slight breathing motion, organic handheld aesthetic while maintaining overall stability"

### Problem: Scale relationships unclear
Solution: "Add common reference object with known size in frame - coffee mug, phone, pen - something that immediately communicates device is approximately 32cm long"

## Landing Page Integration Strategy

This video serves a very specific purpose: it proves the K1 is a REAL THING that exists in PHYSICAL SPACE and belongs on DESKS. This is the antidote to your hero light show video which, while spectacular, might make people wonder if what they're seeing is just impressive CGI.

Place this video in the large bento grid placeholder in your "What Makes K1 Different" section. The user has just watched the magical light animation in the hero, read the technical specs, and now they need grounding. This video says "and yes, this is an actual object that sits on your actual desk."

The psychological bridge this creates:
- Hero video = "Wow, that light effect is incredible (but is it real?)"
- This video = "Oh, I can see exactly where this would sit on my desk"
- Brain conclusion = "This is a legitimate product I can actually buy and use"

## Alternative Seed Image Options

If the 45-degree angle view isn't working well, try these alternatives:

**Front-facing seed:** Use `k1-desk-front.png` instead - this shows device exactly as user would see it sitting at their desk, creates most relatable perspective but less visually interesting than angle view

**Top-down seed:** Use `k1-desk-top.png` - great for showing size relationships and geometric composition, very popular aesthetic on r/battlestations, but loses some dimensionality

Mix and match seed images with camera movement prompts - front-facing seed with slow push-in often works better than angled seed with pan.

## Minimum Viable Version

If AI video generation struggles with complex desk environment, simplify to just the K1 on a clean dark surface with minimal props. A device sitting on plain matte black surface with good lighting is better than a cluttered environment that looks fake. You can always add more environmental context in a V2 video post-launch.