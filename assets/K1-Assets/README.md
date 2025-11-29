# K1-Lightwave Landing Page Asset Generation System

This directory contains everything you need to generate professional video assets for your K1-Lightwave landing page without making any more decisions. Just follow the instructions in order.

## What You Have Here

```
k1-landing-assets/
├── 01-keyshot-seeds/          # Empty folders where you'll save your renders
├── 02-ai-video-generation/    # AI prompts and raw outputs
│   └── prompts/               # Copy-paste ready prompts for AI video tools
├── 03-final-web-assets/       # Final optimized videos ready for web
├── 04-scripts/                # Automation scripts
│   ├── blender-setup-automation.py  # Auto-setup cameras/lights in Blender
│   └── optimize-videos.sh           # Auto-compress videos for web
└── 05-checklists/             # Step-by-step execution guides
    └── MASTER-CHECKLIST.md    # Your complete roadmap

```

## Quick Start (3 Steps)

### Step 1: Generate Seed Images (Use Blender)

1. Open Blender
2. Import your K1 3D model (File > Import > [your format])
3. Open Scripting workspace (top menu bar)
4. Click "Open" and select `04-scripts/blender-setup-automation.py`
5. Click "Run Script"
6. The script creates 14 cameras with proper lighting automatically
7. For each camera:
   - Select it in the Outliner panel
   - View > Cameras > Set Active Camera (or press Ctrl+Numpad 0)
   - Set render resolution to 1920x1080 (Render Properties > Format)
   - Press F12 to render
   - Save to the corresponding category folder in `01-keyshot-seeds/`

**Time estimate:** 1-2 days to render all categories

### Step 2: Generate AI Videos

1. Go to Google Imagen Video (or Runway/Pika)
2. For each category you want to create:
   - Open the prompt file in `02-ai-video-generation/prompts/`
   - Upload your seed image(s) from `01-keyshot-seeds/`
   - Copy-paste the prompt
   - Generate video
   - Download and save to `02-ai-video-generation/raw-outputs/`

**Priority order:**
1. Category 4 (light show) - THIS IS YOUR HERO VIDEO
2. Category 3 (context desk) - Makes device feel real
3. Category 1 (rotation) - Shows device from all angles

**Time estimate:** 2-3 days (mostly waiting for AI generation)

### Step 3: Optimize Videos for Web

1. Open terminal
2. Navigate to scripts folder: `cd 04-scripts/`
3. Run optimization script: `./optimize-videos.sh`
4. Script automatically converts all videos to web-optimized format
5. Final videos saved to `03-final-web-assets/videos/`
6. Copy these files to your website hosting

**Time estimate:** 30 minutes

## The Master Checklist

Open `05-checklists/MASTER-CHECKLIST.md` - this is your complete day-by-day execution plan with every single action spelled out. You don't need to make any decisions, just check boxes.

## The Critical Files

**For the hero video (your #1 priority):**
- Prompt: `02-ai-video-generation/prompts/cat4-light-show-prompt.txt`
- This video must show the LED light animation clearly
- Try 3-5 variations until you get one that makes you think "holy shit"

**For the context video (your #2 priority):**
- Prompt: `02-ai-video-generation/prompts/cat3-context-scale-prompt.txt`
- This video grounds the device in reality (shows it on a desk)
- Makes people believe this is a real product they can buy

**For the rotation video (nice to have):**
- Prompt: `02-ai-video-generation/prompts/cat1-hero-rotation-prompt.txt`
- Shows device from all angles
- Good for specs section or as alternative hero

## Minimum Viable Launch

If you're running out of time, you only need:
1. One light show video (Category 4) - REQUIRED
2. One context video (Category 3) - REQUIRED
3. Everything else can wait until post-launch

Two videos are enough to launch. Don't let perfect be the enemy of done.

## Troubleshooting

**"The Blender script isn't working"**
- Make sure your K1 model is at the origin point (0, 0, 0)
- Check that the model dimensions in the script match your actual model
- Edit lines 20-21 of the script if your model is different size

**"AI video generation isn't giving good results"**
- Try a different seed image with better lighting
- Simplify the prompt (remove descriptive words, keep only technical specs)
- Try a different AI tool (Runway vs Pika vs Imagen have different strengths)

**"Videos are too large for web"**
- The optimization script should compress to ~3-5MB each
- If still too large, edit line 63 of optimize-videos.sh to lower bitrate:
  Change `-b:v 2500k` to `-b:v 1500k`

## Getting Help

If you get stuck:
1. Check the MASTER-CHECKLIST.md - it has more detailed instructions
2. Open the specific prompt file - they have troubleshooting sections
3. If Blender script fails, you can set up cameras manually using the checklist specs

## Remember

You're building video assets to show on a landing page, not creating a feature film. "Good enough to show the device clearly" is your success criteria. Ship with 2-3 videos and iterate later based on actual customer feedback.

The goal is to launch, not to achieve perfection.