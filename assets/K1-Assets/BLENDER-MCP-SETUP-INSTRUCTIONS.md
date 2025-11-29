# BLENDER MCP SETUP - CAPTAIN'S QUICK START
## Full Automation Unlocked! 🚀

**Status:** Claude has configured everything on the server side
**Your Task:** Install the addon in Blender (2 minutes)

---

## ✅ WHAT CLAUDE ALREADY DID

1. ✅ Installed UV package manager
2. ✅ Downloaded Blender MCP server (tested, working)
3. ✅ Updated Claude Desktop config with Blender server
4. ✅ Downloaded addon file to your Downloads folder

**Location:** `~/Downloads/blender-mcp-addon.py` (77KB)

---

## 🎯 YOUR 3-STEP INSTALLATION

### Step 1: Open Blender
```bash
# Launch Blender 4.5.2
open /Applications/Blender.app
```

### Step 2: Install the Addon
1. **Edit → Preferences → Add-ons**
2. **Click the dropdown arrow** next to the search bar
3. **Select "Install from Disk..."**
4. **Navigate to:** `~/Downloads/blender-mcp-addon.py`
5. **Click "Install Add-on from File"**
6. **Enable the addon** by checking the box next to "Interface: Blender MCP"

### Step 3: Connect to Claude
1. **Press N** in the 3D Viewport (opens side panel)
2. **Find the "MCP Server" tab**
3. **Click "Connect to Claude"** button

**✅ Success Indicator:** Button changes to "Connected" or shows green status

---

## 🧪 TEST THE CONNECTION

Once connected, come back to Claude Code and type:
```
Claude, test the Blender MCP connection
```

I'll verify I can communicate with Blender and show you available tools!

---

## 🚀 WHAT THIS UNLOCKS

### BEFORE (Manual Workflow):
1. You run Python script in Blender
2. You manually select cameras
3. You manually click render 14 times
4. You manually save each file
5. **Total time:** 2-4 hours

### AFTER (Automated Workflow):
1. You tell Claude: "Generate all seed images for K1-Lightwave"
2. Claude executes via MCP:
   - Imports K1 model
   - Runs camera setup script
   - Renders all 14 images automatically
   - Saves to correct directories
   - Names files correctly
3. **Total time:** 30 minutes (mostly rendering)

**You do:** Open Blender, click "Connect"
**Claude does:** Everything else

---

## 🎬 NEXT STEPS (After Installation)

1. **Install addon** (2 minutes)
2. **Restart Claude Code** (MCP servers load on startup)
3. **Test connection** with Claude
4. **Import K1 model** to Blender
5. **Tell Claude:** "Generate Category 4 seed images for K1-Lightwave"
6. **Watch the magic happen** ✨

---

## 🛠️ TROUBLESHOOTING

### "Can't find addon in Add-ons list"
- Make sure you enabled it by **checking the box**
- Search for "MCP" or "Blender MCP" in the addon search

### "Connect to Claude button doesn't work"
- Restart Claude Code (MCP server needs to be running)
- Check that the addon is enabled
- Make sure Blender 4.5+ is being used

### "Connection refused"
- Make sure you clicked "Connect to Claude" in Blender
- Verify Claude Code is running
- Check that no firewall is blocking local connections

---

## 💬 COMMUNICATION PROTOCOL

**When ready, tell Claude:**
```
"Blender MCP connected, ready to test!"
```

**Claude will respond with:**
- List of available Blender tools
- Confirmation of connection
- Ready to execute automation

---

## 🎯 THE GAME-CHANGER

This isn't just "a faster way" - this is **full automation**:

**You say:**
> "Claude, generate all seed images for the hero light show video"

**Claude does:**
1. Verifies K1 model is imported
2. Executes camera setup script
3. Sets render settings (1920x1080, PNG)
4. Renders from CAT4_DarkThreeQuarter_Camera
5. Saves to `01-keyshot-seeds/cat4-light-ready-dark/k1-dark-three-quarter.png`
6. Renders from CAT4_DarkFront_Camera
7. Saves correctly
8. Renders from CAT4_DarkSide_Camera
9. Saves correctly
10. Reports completion with file paths

**All while you grab coffee.** ☕

---

## 📊 NEW TIMELINE ESTIMATE

| Phase | Old Time | New Time (MCP) | Savings |
|-------|----------|----------------|---------|
| Phase 1: Blender | 2-4 hours | 30 min | 1.5-3.5 hrs |
| Phase 2: AI Gen | 2-3 days | 2-3 days | 0 (waiting) |
| Phase 3: Optimize | 15 min | 15 min | 0 (already automated) |
| **TOTAL** | **2-4 days** | **2-3 days** | **2-3 hours saved** |

**Calendar time:** Same (AI generation is the bottleneck)
**Hands-on time:** Cut by **50-70%**

---

**Install the addon, Captain!** 🚀
**Then ping me and let's test this beast!** ⚡
