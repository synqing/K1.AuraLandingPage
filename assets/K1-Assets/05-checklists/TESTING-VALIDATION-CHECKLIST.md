# VIDEO INTEGRATION TESTING & VALIDATION CHECKLIST

**Purpose:** Ensure videos load correctly, perform well, and convert visitors
**Owner:** Claude (automated) + Captain (manual validation)
**Stage:** Post-integration, pre-launch

---

## PRE-INTEGRATION CHECKS (Captain - Before Handing to Claude)

### Video File Quality
- [ ] Hero lightshow video plays smoothly (no stuttering)
- [ ] Context desk video plays smoothly (no stuttering)
- [ ] Hero video file size <5MB
- [ ] Context video file size <5MB
- [ ] Both videos are 1920x1080 resolution
- [ ] Both videos are 24fps or 30fps (consistent)
- [ ] No audio tracks present (muted by default)
- [ ] Videos loop seamlessly (no visible cut at loop point)

### Visual Quality Assessment
- [ ] Hero video: Light clearly comes from EDGES (not center)
- [ ] Hero video: Colors are vibrant and saturated
- [ ] Hero video: Black background is pure black (not gray)
- [ ] Hero video: Creates "I want that" emotional response
- [ ] Context video: Device looks REAL (not CG)
- [ ] Context video: Desk environment feels inviting
- [ ] Context video: Device proportions look correct vs keyboard
- [ ] Context video: Lighting creates atmosphere (warm, cozy)

---

## POST-INTEGRATION CHECKS (Claude Automated + Captain Manual)

### File Structure
- [ ] Videos copied to `/public/assets/videos/`
- [ ] Poster images generated and saved to `/public/assets/videos/`
- [ ] File naming follows convention:
  - [ ] `hero-lightshow.mp4`
  - [ ] `hero-lightshow-poster.jpg`
  - [ ] `context-desk.mp4`
  - [ ] `product-showcase-poster.jpg`

### Code Integration
- [ ] `HeroWithVideo.tsx` imported in `app/page.tsx`
- [ ] `HardwareShowcaseWithVideo.tsx` imported in `app/page.tsx`
- [ ] Video `<source>` paths are correct
- [ ] `poster` attributes point to correct images
- [ ] `autoPlay`, `loop`, `muted`, `playsInline` attributes present
- [ ] Fallback content exists for video load failures

### Browser Compatibility Testing

#### Desktop - Chrome
- [ ] Hero video autoplays on page load
- [ ] Hero video loops infinitely
- [ ] Hardware showcase video loads
- [ ] No console errors
- [ ] Videos don't block page render

#### Desktop - Firefox
- [ ] Hero video autoplays
- [ ] All videos play without clicking
- [ ] No MIME type errors
- [ ] Looping works correctly

#### Desktop - Safari
- [ ] Videos autoplay (Safari requires muted)
- [ ] `playsInline` attribute working
- [ ] No playback errors
- [ ] Poster images show during load

#### Mobile - iOS Safari
- [ ] Videos load (may require user interaction)
- [ ] `playsInline` prevents fullscreen
- [ ] Bandwidth usage acceptable (<10MB total)
- [ ] Page loads in <3 seconds on 4G

#### Mobile - Android Chrome
- [ ] Videos autoplay if muted
- [ ] Looping works on mobile
- [ ] No memory leaks after 5+ loops
- [ ] Acceptable battery drain

### Performance Testing

#### Page Load Performance
- [ ] Initial page load <2 seconds (without videos fully loaded)
- [ ] Largest Contentful Paint (LCP) <2.5s
- [ ] First Input Delay (FID) <100ms
- [ ] Cumulative Layout Shift (CLS) <0.1
- [ ] Videos don't block above-fold content render

#### Video Loading Strategy
- [ ] Hero video uses `preload="auto"` (loads immediately)
- [ ] Showcase video uses `preload="metadata"` (lazy loads)
- [ ] Poster images show instantly
- [ ] No layout shift when videos load
- [ ] Fallback to poster if video fails

#### Network Performance
Run on "Fast 3G" throttling (Chrome DevTools):
- [ ] Page usable before videos load
- [ ] Poster images load within 1 second
- [ ] Videos load progressively (not all at once)
- [ ] No timeout errors
- [ ] Graceful degradation if videos fail

### Accessibility Checks
- [ ] Videos don't autoplay audio (muted by default)
- [ ] Keyboard navigation doesn't get trapped
- [ ] Screen readers announce video presence
- [ ] `aria-label` or `title` attributes present on videos
- [ ] Users can pause video if they want (controls hidden but functional)

### SEO & Meta Checks
- [ ] Video schema markup added to `layout.tsx` (optional)
- [ ] Poster images have descriptive alt text
- [ ] Open Graph video tags present (if sharing video)
- [ ] Videos don't hurt Lighthouse SEO score

---

## USER EXPERIENCE VALIDATION (Captain - Manual Testing)

### First Impression Test
**Task:** Land on page, observe first 3 seconds

- [ ] Hero video catches attention immediately
- [ ] Light animation is mesmerizing (hard to look away)
- [ ] Video doesn't distract from headline/CTA
- [ ] Gradient overlay ensures text is readable
- [ ] Video enhances rather than detracts from message

### Scroll Behavior Test
**Task:** Scroll through entire page

- [ ] Hero video doesn't slow down scroll
- [ ] Showcase video comes into view smoothly
- [ ] No janky/stuttering scroll performance
- [ ] Videos pause/play appropriately (if implemented)

### Conversion Psychology Test
**Task:** Put yourself in buyer's shoes

- [ ] Hero video creates immediate curiosity ("What is this?")
- [ ] Light show demonstrates value proposition clearly
- [ ] Context video makes device feel real/obtainable
- [ ] Videos together justify $249 price point
- [ ] Creates FOMO/urgency when combined with scarcity counter

### Device-Specific Tests

#### On Your Primary Development Machine
- [ ] Videos load and play correctly
- [ ] No performance degradation
- [ ] Battery life not significantly impacted

#### On Actual Smartphone (Not Emulator)
- [ ] Page loads on mobile data (<10MB total)
- [ ] Videos enhance mobile experience (don't just work)
- [ ] Touch interactions don't conflict with video
- [ ] Autoplay works or graceful fallback exists

---

## ANALYTICS & TRACKING VALIDATION

### Video Engagement Tracking
- [ ] Analytics track video impressions
- [ ] Analytics track video play events
- [ ] Analytics track video completion rate
- [ ] Can measure which video converts better

### Performance Monitoring
- [ ] Core Web Vitals tracked in production
- [ ] Video load errors logged
- [ ] Bandwidth usage monitored
- [ ] User engagement metrics captured

---

## PRODUCTION READINESS CHECKS

### CDN & Hosting
- [ ] Videos served from CDN (or planned)
- [ ] Correct MIME types set (`video/mp4`)
- [ ] Gzip/Brotli compression enabled
- [ ] Cache headers configured (long TTL for videos)

### Backup & Fallbacks
- [ ] Poster images work if video fails
- [ ] Page functional without JavaScript
- [ ] Graceful degradation to static images
- [ ] Error states don't break layout

### Final Pre-Launch Validation
- [ ] All videos play on staging environment
- [ ] Videos work on production build (`npm run build`)
- [ ] No console errors in production mode
- [ ] Videos load on fresh browser (no cache)
- [ ] Share preview on social media shows correct images

---

## SUCCESS CRITERIA SUMMARY

### Minimum Requirements (Must Pass)
- ✅ Hero lightshow video loads and autoplays
- ✅ Context desk video loads in showcase
- ✅ Both videos <5MB each
- ✅ Page loads in <3 seconds on 4G
- ✅ No console errors on any major browser
- ✅ Videos work on iOS Safari and Chrome

### Ideal Performance (Should Pass)
- ✅ Lighthouse Performance score >90
- ✅ Videos load progressively (not blocking)
- ✅ Smooth scroll even with videos playing
- ✅ Video engagement rate >50% (users watch)
- ✅ No layout shift when videos load

### Conversion Metrics (Measure Post-Launch)
- Video impression rate (% of visitors who see it)
- Video completion rate (% who watch to end)
- CTA click rate (hero CTA with vs without video)
- Bounce rate (should decrease with engaging video)

---

## TROUBLESHOOTING COMMON ISSUES

### Videos Won't Autoplay
**Symptoms:** Videos show poster but don't start
**Fix:**
1. Verify `muted` attribute present
2. Check `playsInline` for mobile
3. Add `autoplay` to video element
4. Check browser autoplay policy

### Videos Cause Layout Shift
**Symptoms:** Page jumps when video loads
**Fix:**
1. Set explicit width/height on video element
2. Use `aspect-ratio` CSS property
3. Reserve space with poster image
4. Use `object-fit: cover`

### Performance Issues
**Symptoms:** Slow page load, high CPU usage
**Fix:**
1. Reduce video bitrate (re-run optimize script with lower target)
2. Implement lazy loading for non-hero videos
3. Add `preload="metadata"` instead of `auto`
4. Consider shorter video duration

### Mobile Data Usage Concerns
**Symptoms:** Videos too large for mobile users
**Fix:**
1. Create mobile-optimized versions (lower res)
2. Use `<source>` with media queries
3. Detect mobile and skip autoplay
4. Implement "click to play" on mobile

---

## REPORTING TEMPLATE

After testing, fill out this summary:

```markdown
## Video Integration Test Results

**Date:** [YYYY-MM-DD]
**Tester:** [Captain/Claude]
**Environment:** [Local/Staging/Production]

### Pass/Fail Summary
- Pre-Integration Checks: [ ] Pass [ ] Fail
- Post-Integration Checks: [ ] Pass [ ] Fail
- Browser Compatibility: [ ] Pass [ ] Fail
- Performance: [ ] Pass [ ] Fail
- User Experience: [ ] Pass [ ] Fail

### Issues Found:
1. [Issue description]
   - Severity: [Low/Medium/High/Critical]
   - Status: [Open/Fixed/Blocked]

2. [Issue description]
   - Severity: [Low/Medium/High/Critical]
   - Status: [Open/Fixed/Blocked]

### Recommendations:
- [Action item 1]
- [Action item 2]

### Sign-Off:
[ ] Ready for production deployment
[ ] Requires fixes before launch
[ ] Blocked by: [blocker description]
```

---

**Testing complete? Run through this checklist before launch!** ✅
