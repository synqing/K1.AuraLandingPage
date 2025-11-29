# K1-Lightwave Landing Page Asset Generation
## Master Execution Checklist

**Total Estimated Time: 5-7 days full-time**

---

## PHASE 1: KeyShot/Blender Seed Image Generation (Days 1-2)

### Category 1: Hero Rotations
- [ ] Import K1 3D model into Blender or KeyShot
- [ ] Set camera to 3/4 view, elevated 15 degrees above horizon
- [ ] Configure lighting: key light upper right (intensity 0.8), rim light behind (intensity 0.4)
- [ ] Position camera 50cm from device center
- [ ] Render at 12-degree rotation increments (30 total frames)
- [ ] Output resolution: 1920x1080, PNG format
- [ ] Save all frames to: `/01-keyshot-seeds/cat1-hero-rotations/`
- [ ] Naming convention: `k1-rotation-frame-001.png` through `k1-rotation-frame-030.png`

### Category 2: Edge Detail Close-ups
- [ ] Move camera to 10cm from left edge of device
- [ ] Frame showing: PCB mounting area, light guide plate, dual-edge structure
- [ ] Use grazing side lighting (intensity 0.9) to emphasize geometry
- [ ] Render left edge view
- [ ] Repeat for right edge, top detail, bottom detail (4 total renders)
- [ ] Output resolution: 1920x1080, PNG format
- [ ] Save to: `/01-keyshot-seeds/cat2-edge-closeups/`
- [ ] Naming: `k1-edge-left.png`, `k1-edge-right.png`, `k1-edge-top.png`, `k1-edge-bottom.png`

### Category 3: Context Scale (Desk Environment)
- [ ] Add desk props to scene: keyboard, mouse, monitor edge
- [ ] Position K1 as it would naturally sit on desk
- [ ] Lighting: ambient room light + warm desk lamp creating pools
- [ ] Render front view (user POV)
- [ ] Render 45-degree side angle
- [ ] Render top-down view
- [ ] Output resolution: 1920x1080, PNG format
- [ ] Save to: `/01-keyshot-seeds/cat3-context-scale/`
- [ ] Naming: `k1-desk-front.png`, `k1-desk-angle.png`, `k1-desk-top.png`

### Category 4: Light-Ready Dark Backgrounds
- [ ] Set background to pure black (#000000)
- [ ] Use only rim lighting to define edges (intensity 0.3)
- [ ] Device should be mostly silhouette
- [ ] Render front-facing view
- [ ] Render 3/4 view
- [ ] Render pure side profile
- [ ] Output resolution: 1920x1080, PNG format
- [ ] Save to: `/01-keyshot-seeds/cat4-light-ready-dark/`
- [ ] Naming: `k1-dark-front.png`, `k1-dark-three-quarter.png`, `k1-dark-side.png`

### Category 5: Material Detail Macro
- [ ] Camera extreme close-up on aluminum housing texture
- [ ] Frame showing brushed metal grain and SpectraSynq branding
- [ ] Camera close-up on light guide plate edge (show transparency/refraction)
- [ ] Camera close-up on corner detail/seam
- [ ] Camera close-up on USB-C port area
- [ ] Camera close-up on mounting bracket detail
- [ ] Camera close-up on LED PCB detail
- [ ] Output resolution: 1920x1080, PNG format
- [ ] Save to: `/01-keyshot-seeds/cat5-material-macro/`
- [ ] Naming: `k1-macro-aluminum.png`, `k1-macro-acrylic.png`, `k1-macro-corner.png`, etc.

---

## PHASE 2: AI Video Generation (Days 3-5)

### Setup
- [ ] Open Google Imagen Video (or Runway/Pika as backup)
- [ ] Have all seed images ready in organized folders
- [ ] Have prompt files open from `/02-ai-video-generation/prompts/`

### Category 1: Hero Rotation Videos
- [ ] Upload all 30 rotation frames as sequence
- [ ] Use prompt from `cat1-hero-rotation-prompt.txt`
- [ ] Generate 10-second video at 24fps
- [ ] Download and save to `/02-ai-video-generation/raw-outputs/cat1/`
- [ ] Review for artifacts or geometry changes
- [ ] If unsatisfactory, adjust seed images lighting and regenerate

### Category 2: Edge Detail with LED Animation
- [ ] Upload `k1-edge-left.png` as seed image
- [ ] Use prompt from `cat2-edge-closeup-prompt.txt`
- [ ] Generate 5-second video
- [ ] Repeat for all 4 edge views
- [ ] Save to `/02-ai-video-generation/raw-outputs/cat2/`
- [ ] Review LED animation timing and color behavior

### Category 3: Context Desk Videos
- [ ] Upload `k1-desk-angle.png` as primary seed
- [ ] Use prompt from `cat3-context-scale-prompt.txt`
- [ ] Generate 8-second video with subtle camera push
- [ ] Repeat for front view with slight pan
- [ ] Save to `/02-ai-video-generation/raw-outputs/cat3/`

### Category 4: Full Light Show Videos
- [ ] Upload `k1-dark-three-quarter.png` as seed
- [ ] Use prompt from `cat4-light-show-prompt.txt`
- [ ] Generate 12-second video with full LED animation
- [ ] Try 3 variations with different color schemes
- [ ] Save best variation to `/02-ai-video-generation/raw-outputs/cat4/`
- [ ] **This is your hero video - spend time getting it perfect**

### Category 5: Material Macro Videos
- [ ] Upload macro seed images
- [ ] Use prompt from `cat5-material-macro-prompt.txt`
- [ ] Generate 3-5 second videos with subtle camera slide
- [ ] Generate 4-6 short clips from different macro seeds
- [ ] Save to `/02-ai-video-generation/raw-outputs/cat5/`

---

## PHASE 3: Video Optimization & Web Prep (Day 6)

### Compression and Format Conversion
- [ ] Install ffmpeg if not already available: `sudo apt-get install ffmpeg`
- [ ] Run video optimization script: `bash 04-scripts/optimize-videos.sh`
- [ ] This converts all videos to web-optimized MP4 (H.264, 1080p, ~3-5MB each)
- [ ] Optimized videos save to `/03-final-web-assets/videos/`

### Naming for Web Integration
- [ ] Rename files for clarity:
  - `hero-rotation.mp4` (Category 1 best take)
  - `hero-lightshow.mp4` (Category 4 best take) 
  - `context-desk.mp4` (Category 3 best take)
  - `detail-edge-left.mp4`, `detail-edge-right.mp4` (Category 2)
  - `macro-aluminum.mp4`, `macro-acrylic.mp4` (Category 5)

---

## PHASE 4: Landing Page Integration (Day 7)

### Update HTML
- [ ] Open your Version 2 HTML file
- [ ] Find the hero video placeholder section (line ~150-200)
- [ ] Replace placeholder div with actual video element
- [ ] Point `<source>` tag to `/03-final-web-assets/videos/hero-lightshow.mp4`
- [ ] Add `autoplay loop muted playsinline` attributes
- [ ] Test in browser - video should autoplay on load

### Bento Grid Video Integration
- [ ] Find bento grid video placeholder (line ~400-450)
- [ ] Replace with `<video>` element pointing to `context-desk.mp4`
- [ ] Add same autoplay attributes

### Test Across Devices
- [ ] Desktop Chrome: Autoplay works? Video loops smoothly?
- [ ] Mobile Safari: Playsinline attribute working?
- [ ] Firefox: No playback issues?
- [ ] Check file loading time - videos should be <5MB each

---

## PHASE 5: Final Quality Check

- [ ] Watch entire landing page flow from top to bottom
- [ ] Hero video triggers immediate "wait, what is that?" response?
- [ ] Technical specs section feels credible and precise?
- [ ] Context video makes device feel real and tangible?
- [ ] No broken links, missing videos, or placeholder text remaining?
- [ ] Page loads in under 3 seconds on average connection?

---

## DECISION CHECKPOINT: SHIP OR ITERATE?

Ask yourself: "If I landed on this page right now, would I instantly understand what the K1 does and want to reserve one?"

**If YES:** You're done. Deploy the page. Start driving traffic.

**If NO:** Identify the specific element that's not working. Is it:
- Hero video not showing the magic clearly enough? → Regenerate Category 4 with adjusted prompt
- Device feels abstract/fake? → Add more Category 3 context videos
- Technical credibility lacking? → Add Category 2 edge detail clips to specs section

**Only iterate on the specific broken element. Do not rebuild everything.**

---

## EMERGENCY SHORTCUTS

If you're running out of time and need to launch NOW:

**Minimum Viable Asset Set:**
- 1 hero video (Category 4 light show) - REQUIRED
- 1 context video (Category 3 desk environment) - REQUIRED  
- 1 rotation or detail video (Category 1 or 2) - Nice to have

You can launch with just these three videos and add the rest post-launch.

---

## NOTES

- This checklist is designed to be followed linearly without making decisions
- If you get stuck on any step, move to the next step and come back later
- Timebox each phase - don't spend more than the estimated time trying to perfect anything
- Good enough and shipped beats perfect and delayed