# CAPTAIN'S EXECUTION HANDOFF GUIDE
## What Claude Did vs What You Need to Do

**Last Updated:** 2025-11-18
**Status:** Ready for Captain execution

---

## 🤖 WHAT CLAUDE COMPLETED FOR YOU

### ✅ Directory Structure
Created complete asset pipeline in `K1-Assets/`:
```
K1-Assets/
├── 01-keyshot-seeds/          # ← You'll save Blender renders here
│   ├── cat1-hero-rotations/
│   ├── cat2-edge-closeups/
│   ├── cat3-context-scale/
│   ├── cat4-light-ready-dark/ # ← PRIORITY: Hero video seeds
│   └── cat5-material-macro/
├── 02-ai-video-generation/
│   ├── prompts/               # ← Copy-paste ready AI prompts
│   └── raw-outputs/           # ← Download AI videos here
│       ├── cat1/
│       ├── cat2/
│       ├── cat3/              # ← PRIORITY: Context desk video
│       ├── cat4/              # ← PRIORITY: Light show video
│       └── cat5/
├── 03-final-web-assets/
│   ├── videos/                # ← Optimized web-ready videos land here
│   └── images/                # ← Poster frames go here
├── 04-scripts/
│   ├── blender-setup-automation.py  # ← Ready to run in Blender
│   └── optimize-videos.sh           # ← Ready to optimize videos
└── 05-checklists/             # ← This file + master checklist
```

### ✅ Scripts Created
1. **Blender Automation** (`04-scripts/blender-setup-automation.py`)
   - Auto-creates 14 cameras across 5 categories
   - Auto-configures lighting for each category
   - Ready to run in Blender's Scripting workspace

2. **Video Optimization** (`04-scripts/optimize-videos.sh`)
   - Executable and ready to run
   - Auto-converts all AI videos to web format
   - Target: <5MB per video, H.264, 1080p, 24fps

### ✅ AI Prompts Written
Created copy-paste ready prompts for:
- `cat1-hero-rotation.txt` - Rotation showcase (nice to have)
- `cat3-context-desk.txt` - **CRITICAL #2** - Trust builder
- `cat4-light-show-HERO.txt` - **CRITICAL #1** - The money shot

### ✅ Landing Page Code
Created video-ready React components:
- `components/HeroWithVideo.tsx` - Background video + video showcase
- `components/HardwareShowcaseWithVideo.tsx` - Bento grid with product video

---

## 👨‍✈️ CAPTAIN'S CRITICAL PATH (What YOU Must Do)

### 🎯 MINIMUM VIABLE LAUNCH: 2 Videos Required

You need exactly **2 videos** to launch:
1. **Category 4: Light Show** (hero video) - Shows the magic
2. **Category 3: Context Desk** (grounds in reality) - Builds trust

Everything else can wait.

---

## PHASE 1: BLENDER SEED IMAGE GENERATION
**Your Task:** Create the source renders for AI video generation

**Estimated Time:** 2-4 hours (just for Cat 3 & 4)

### Step 1.1: Open Blender & Import K1 Model
```bash
# 1. Launch Blender
# 2. File > Import > [your K1 model format]
# 3. Center model at origin (0, 0, 0)
# 4. Ensure model dimensions match script:
#    - Length: 32cm (0.32m)
#    - Width: 5.4cm (0.054m)
```

### Step 1.2: Run Automation Script
```bash
# 1. Switch to Scripting workspace (top menu bar)
# 2. Click "Open" button
# 3. Navigate to: K1-Assets/04-scripts/blender-setup-automation.py
# 4. Click "Run Script" button
# 5. Check console for success messages
```

**✅ Success Indicators:**
- Console shows "SETUP COMPLETE!"
- Outliner shows multiple cameras (CAT1_*, CAT2_*, etc.)
- Scene has lights added

**❌ If Script Fails:**
1. Check model is at origin (0, 0, 0)
2. Verify Blender version ≥ 3.0
3. Ping Claude with error message

### Step 1.3: Render Priority Seed Images

**ONLY render these 2 categories for launch:**

#### Category 4: Light Show Seeds (HIGHEST PRIORITY)
```bash
# 1. Select camera: CAT4_DarkThreeQuarter_Camera
# 2. View > Cameras > Set Active Camera (or Ctrl+Numpad 0)
# 3. Render Properties > Format:
#    - Resolution: 1920 x 1080
#    - Frame Rate: 24 fps
#    - File Format: PNG
# 4. Output > Output Path: K1-Assets/01-keyshot-seeds/cat4-light-ready-dark/
# 5. Press F12 to render
# 6. Image > Save As: "k1-dark-three-quarter.png"
```

Repeat for `CAT4_DarkFront_Camera` and `CAT4_DarkSide_Camera` if you have time.
**Priority:** Get at least `k1-dark-three-quarter.png` - that's your hero seed.

#### Category 3: Context Desk Seeds (2ND PRIORITY)
```bash
# 1. Add desk props to scene:
#    - Import keyboard model (or use cube as placeholder)
#    - Import mouse model (or use sphere as placeholder)
#    - Add plane for desk surface
# 2. Select camera: CAT3_DeskAngle_Camera
# 3. Same render settings as above
# 4. Output path: K1-Assets/01-keyshot-seeds/cat3-context-scale/
# 5. Render and save as: "k1-desk-angle.png"
```

**⚠️ CHECKPOINT:** Do you have these 2 files?
- `01-keyshot-seeds/cat4-light-ready-dark/k1-dark-three-quarter.png`
- `01-keyshot-seeds/cat3-context-scale/k1-desk-angle.png`

If YES → Proceed to Phase 2
If NO → Fix Blender issues, ping Claude if stuck

---

## PHASE 2: AI VIDEO GENERATION
**Your Task:** Upload seeds to AI tools and generate videos

**Estimated Time:** 2-3 days (mostly waiting for AI)

### Step 2.1: Sign Up for AI Video Tools

**Primary Option (Best Results):**
- Google Imagen Video: https://ai.google.dev/tutorials/imagen_video
- Free tier: 50 generations/month

**Backup Options:**
- Runway Gen-3: https://runwayml.com/ (paid, but fast)
- Pika Labs: https://pika.art/ (free tier available)
- Luma Dream Machine: https://lumalabs.ai/ (new, experimental)

### Step 2.2: Generate Category 4 Light Show Video

**This is THE critical asset. Do this first.**

```bash
# 1. Open: K1-Assets/02-ai-video-generation/prompts/cat4-light-show-HERO.txt
# 2. Go to your chosen AI video tool
# 3. Upload seed image: 01-keyshot-seeds/cat4-light-ready-dark/k1-dark-three-quarter.png
# 4. Copy-paste the PRIMARY PROMPT from cat4-light-show-HERO.txt
# 5. Settings:
#    - Duration: 12 seconds
#    - Frame Rate: 24fps (or 30fps if only option)
#    - Resolution: 1080p
# 6. Generate (expect 5-30 min wait depending on tool)
# 7. Download result
# 8. Save to: 02-ai-video-generation/raw-outputs/cat4/
```

**🎯 Quality Check:**
Watch the video. Ask yourself:
- "Do I want this on my desk?" → If NO, regenerate
- "Does this justify $249?" → If NO, regenerate
- "Does light come from the EDGES?" → If NO, regenerate
- "Do I feel desire/FOMO?" → If NO, regenerate

**TRY 3-5 VARIATIONS** until you get one that makes you think "holy shit."

Try different color schemes:
- Cool spectrum (blue → cyan → white)
- Warm spectrum (amber → orange → magenta)
- Rainbow (full spectrum wheel)

### Step 2.3: Generate Category 3 Context Desk Video

```bash
# 1. Open: K1-Assets/02-ai-video-generation/prompts/cat3-context-desk.txt
# 2. Upload seed: 01-keyshot-seeds/cat3-context-scale/k1-desk-angle.png
# 3. Copy PRIMARY PROMPT (or use ALTERNATIVE if primary fails)
# 4. Settings:
#    - Duration: 8 seconds
#    - Frame Rate: 24fps
#    - Resolution: 1080p
# 5. Generate
# 6. Save to: 02-ai-video-generation/raw-outputs/cat3/
```

**🎯 Quality Check:**
- Does the device look REAL (not CG)? ✅
- Can you imagine this on YOUR desk? ✅
- Does it feel premium/approachable? ✅
- Is the environment inviting? ✅

**⚠️ CHECKPOINT:** Do you have these 2 videos?
- `02-ai-video-generation/raw-outputs/cat4/[your-light-show-video].mp4`
- `02-ai-video-generation/raw-outputs/cat3/[your-context-video].mp4`

If YES → Proceed to Phase 3
If NO → Try different AI tool or adjust prompts, ping Claude

---

## PHASE 3: VIDEO OPTIMIZATION
**Your Task:** Convert AI videos to web-optimized format

**Estimated Time:** 10-15 minutes

### Step 3.1: Install ffmpeg (if needed)

**Mac:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Verify installation:**
```bash
ffmpeg -version
```

### Step 3.2: Run Optimization Script

```bash
cd /Users/spectrasynq/Workspace_Management/Software/K1.Landing-Page/K1-Assets/04-scripts
bash optimize-videos.sh
```

**Script will:**
- Find all videos in `02-ai-video-generation/raw-outputs/`
- Convert to H.264, 1080p, 24fps
- Compress to ~3-5MB per video
- Save to `03-final-web-assets/videos/`
- Create inventory file listing all outputs

**✅ Success Indicators:**
- Console shows "✓ Optimized: [filename]"
- Console shows final count: "Processed: 2 videos"
- Files exist in `03-final-web-assets/videos/`

### Step 3.3: Rename Videos for Clarity

```bash
cd /Users/spectrasynq/Workspace_Management/Software/K1.Landing-Page/K1-Assets/03-final-web-assets/videos

# Rename to semantic names:
mv [cat4-output]_optimized.mp4 hero-lightshow.mp4
mv [cat3-output]_optimized.mp4 context-desk.mp4
```

**⚠️ CHECKPOINT:** Do these files exist and play correctly?
- `03-final-web-assets/videos/hero-lightshow.mp4` (<5MB, 1080p, plays smoothly)
- `03-final-web-assets/videos/context-desk.mp4` (<5MB, 1080p, plays smoothly)

If YES → **PING CLAUDE** - Ready for integration
If NO → Check ffmpeg output for errors, ping Claude

---

## 🤖 HANDOFF BACK TO CLAUDE (You're Done!)

### What to Tell Claude:

**If videos are ready:**
```
Hey Captain Claude! Phase 1-3 complete. I have:
- hero-lightshow.mp4 (X MB, looks amazing)
- context-desk.mp4 (Y MB, looks great)

Both are in K1-Assets/03-final-web-assets/videos/

Ready for you to integrate into the landing page!
```

**If you hit blockers:**
```
Claude, I'm stuck at [Phase X, Step Y].

Error message: [paste error]
OR
Issue: [describe what's not working]

Current status:
- Blender renders: [done/blocked]
- AI videos: [done/blocked]
- Optimization: [done/blocked]
```

---

## WHAT CLAUDE WILL DO NEXT (After Your Handoff)

Once you hand back with videos ready, Claude will:

1. ✅ Copy videos to `public/assets/videos/` in the Next.js app
2. ✅ Generate poster images (first frame of each video)
3. ✅ Update `app/page.tsx` to use new video components
4. ✅ Test video loading, autoplay, and fallbacks
5. ✅ Optimize loading performance (lazy load, preload hints)
6. ✅ Add video accessibility (captions track structure)
7. ✅ Create git commit with all changes
8. ✅ Run production build and verify

You just focus on getting those 2 videos generated and optimized.
Claude handles the code integration automatically.

---

## QUICK REFERENCE: File Locations

**Your Working Directories:**
```
Blender renders → 01-keyshot-seeds/cat{3,4}-*/
AI prompts      → 02-ai-video-generation/prompts/*.txt
Download videos → 02-ai-video-generation/raw-outputs/cat{3,4}/
Optimized files → 03-final-web-assets/videos/
```

**Scripts You'll Run:**
```bash
# In Blender Scripting workspace:
K1-Assets/04-scripts/blender-setup-automation.py

# In terminal:
bash K1-Assets/04-scripts/optimize-videos.sh
```

---

## TIMELINE ESTIMATE

**Focused execution (just Cat 3 & 4):**
- Blender setup + renders: 2-4 hours
- AI video generation: 2-3 days (mostly waiting)
- Video optimization: 15 minutes

**Total calendar time:** 3-4 days
**Total hands-on time:** 3-5 hours

---

## TROUBLESHOOTING

### Blender script won't run
- Check Blender ≥ 3.0
- Verify model at origin (0,0,0)
- Ping Claude with console error

### AI videos look terrible
- Try different color scheme prompt
- Use ALTERNATIVE PROMPT (simpler)
- Try different AI tool (Runway vs Pika vs Imagen)
- Ping Claude for prompt refinement

### ffmpeg not found
- Install via brew (Mac) or apt-get (Linux)
- Check PATH includes ffmpeg location
- Run `which ffmpeg` to verify

### Videos too large (>5MB)
- Edit line 68 of optimize-videos.sh
- Change `-b:v 2500k` to `-b:v 1500k`
- Re-run script

---

## MINIMUM SUCCESS CRITERIA

Before handing back to Claude, you MUST have:

- [ ] 2 video files in `03-final-web-assets/videos/`:
  - [ ] `hero-lightshow.mp4` (<5MB, 1080p, 12s, shows LED magic)
  - [ ] `context-desk.mp4` (<5MB, 1080p, 8s, shows desk environment)
- [ ] Both videos play without errors
- [ ] Light show video creates "I want that" feeling
- [ ] Context video makes device feel real/tangible

If all checkboxes ticked → Ping Claude for integration
If any missing → Work through blockers or ask Claude for help

---

**You've got this, Captain! 🚀**

Execute Phases 1-3, hand back to Claude for Phase 4.
The heavy technical lifting is automated - you just need to create the visual assets.
