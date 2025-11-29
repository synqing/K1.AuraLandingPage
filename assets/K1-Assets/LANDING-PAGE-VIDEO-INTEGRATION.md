# K1-Lightwave Landing Page Video Integration Guide

## Executive Summary

This document provides complete integration instructions for the K1-Lightwave hero video assets (10 hero renders + 6 AI-generated videos) into the React landing page. It covers asset optimization, component architecture, responsive design patterns, performance tuning, and deployment strategies.

**Status:** Ready for integration
**Assets Ready:** 10 hero renders (BLEND1-10.png) + Video generation prompts
**Last Updated:** 2025-11-19

---

## 1. Asset Directory Structure

```
K1.Landing-Page/
├── K1-Assets/
│   ├── BLEND1.png through BLEND10.png      # Hero render stills (1920x1080 each)
│   ├── ai-video-generation-prompts.md      # AI generation briefs (6 videos)
│   ├── Vid.optimisation.md                 # ffmpeg optimization script
│   └── LANDING-PAGE-VIDEO-INTEGRATION.md   # This document
│
├── app/
│   ├── public/
│   │   └── videos/                         # Final optimized videos go here
│   │       ├── hero-epic-reveal.mp4        # Tier 1: Main hero video
│   │       ├── hero-ambient-loop.mp4       # Tier 1: Mood/background
│   │       ├── gaming-performance.mp4      # Tier 2
│   │       ├── social-media-loop.mp4       # Tier 2
│   │       ├── developer-flex.mp4          # Tier 3
│   │       └── home-theater-setup.mp4      # Tier 3
│   │
│   ├── components/
│   │   ├── HeroWithVideo.tsx               # Primary hero section
│   │   ├── HardwareShowcaseWithVideo.tsx   # Secondary showcase
│   │   ├── VideoOptimizer.tsx              # Responsive video handling
│   │   └── VideoPreloader.ts               # Intelligent preloading
│   │
│   └── hooks/
│       ├── useVideoPlayback.ts             # Video state management
│       └── useResponsiveVideo.ts           # Responsive video dimensions
│
└── docs/
    └── 09-implementation/
        └── K1-LP.Impl_VIDEO_INTEGRATION_v1.0.md
```

---

## 2. Video Asset Specifications

### Tier 1 (Critical - Deploy First)

#### 2.1 Epic LED Reveal (`hero-epic-reveal.mp4`)
- **Purpose:** Main landing page hero section video
- **Duration:** 5-8 seconds
- **Loop:** Yes (should seamlessly loop)
- **Use Case:** Autoplay muted on hero section, with sound icon for unmute
- **Target File Size:** < 2.5 MB (H.264, 1920x1080, 24fps)
- **Placeholder:** Use BLEND2.png + BLEND5.png composited

#### 2.2 Ambient Loop (`hero-ambient-loop.mp4`)
- **Purpose:** Background mood video for secondary sections or pause state
- **Duration:** 10-15 seconds
- **Loop:** Yes (seamless loop critical)
- **Use Case:** Ambient background during scrolling, alternative to hero video
- **Target File Size:** < 3 MB (H.264, 1920x1080, 24fps)
- **Placeholder:** Use BLEND3.png + BLEND8.png composite with slow fade

### Tier 2 (Important - Deploy Second)

#### 2.3 Gaming/Performance Demo (`gaming-performance.mp4`)
- **Purpose:** Showcase LED versatility and real-time responsiveness
- **Duration:** 6-10 seconds
- **Loop:** Yes
- **Use Case:** Mid-page section showing use cases or features
- **Target File Size:** < 2.5 MB
- **Placeholder:** BLEND4.png + BLEND7.png

#### 2.4 Social Media Loop (`social-media-loop.mp4`)
- **Purpose:** Vertical format (9:16) for social sharing
- **Duration:** 3-5 seconds
- **Loop:** Yes (punchy, attention-grabbing)
- **Use Case:** Social media embeds, Instagram/TikTok cards
- **Target File Size:** < 1.5 MB
- **Placeholder:** BLEND1.png + BLEND6.png (vertical crop)

### Tier 3 (Nice-to-Have - Deploy Last)

#### 2.5 Developer Flex (`developer-flex.mp4`)
- **Purpose:** Appeal to technical/hacker audience
- **Duration:** 8-12 seconds
- **Use Case:** Optional technical showcase section
- **Target File Size:** < 2.5 MB
- **Placeholder:** BLEND9.png

#### 2.6 Home Theater Setup (`home-theater-setup.mp4`)
- **Purpose:** Use case demonstration in realistic context
- **Duration:** 8-10 seconds
- **Use Case:** Optional "in the wild" section
- **Target File Size:** < 2.5 MB
- **Placeholder:** BLEND10.png

---

## 3. React Component Architecture

### 3.1 HeroWithVideo.tsx (Primary Hero Section)

```typescript
// app/components/HeroWithVideo.tsx
import { useRef, useState, useEffect } from 'react';
import { useResponsiveVideo } from '@/hooks/useResponsiveVideo';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';

interface HeroWithVideoProps {
  videoSrc: string;
  fallbackImage: string;
  autoPlay?: boolean;
  muted?: boolean;
  enableControls?: boolean;
}

export function HeroWithVideo({
  videoSrc,
  fallbackImage,
  autoPlay = true,
  muted = true,
  enableControls = true,
}: HeroWithVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay && muted);
  const [isMuted, setIsMuted] = useState(muted);

  const { videoWidth, videoHeight, containerWidth } = useResponsiveVideo(containerRef);
  const { hasError, isLoading } = useVideoPlayback(videoRef);

  // Aspect ratio calculation for responsive sizing
  const aspectRatio = videoWidth / videoHeight;
  const calculatedHeight = containerWidth / aspectRatio;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden rounded-lg"
      style={{
        aspectRatio: `${aspectRatio}`,
        minHeight: '400px',
      }}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
          <div className="animate-pulse">
            <img
              src={fallbackImage}
              alt="Loading..."
              className="w-full h-full object-cover opacity-50"
            />
          </div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay={autoPlay}
        muted={isMuted}
        loop
        playsInline
        poster={fallbackImage}
        onError={() => {
          // Fallback to image on error
          if (containerRef.current) {
            containerRef.current.innerHTML = `<img src="${fallbackImage}" class="w-full h-full object-cover" />`;
          }
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        <img src={fallbackImage} alt="K1-Lightwave Hero" className="w-full h-full object-cover" />
      </video>

      {/* Overlay gradient for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Sound toggle button (if not muted by default) */}
      {enableControls && !muted && (
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-4 right-4 z-10 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full p-3 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeXIcon className="w-6 h-6" />
          ) : (
            <Volume2Icon className="w-6 h-6" />
          )}
        </button>
      )}

      {/* Error fallback */}
      {hasError && (
        <img
          src={fallbackImage}
          alt="K1-Lightwave"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
```

### 3.2 VideoOptimizer.tsx (Responsive Wrapper)

```typescript
// app/components/VideoOptimizer.tsx
import { useEffect, useRef, useState } from 'react';

interface VideoOptimizerProps {
  sources: {
    mobile?: string;      // Mobile-optimized (lower bitrate)
    tablet?: string;      // Tablet-optimized
    desktop?: string;     // Full-quality desktop
    fallback: string;     // Fallback MP4
  };
  poster: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export function VideoOptimizer({
  sources,
  poster,
  autoPlay = true,
  muted = true,
  loop = true,
}: VideoOptimizerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  useEffect(() => {
    // Determine optimal source based on viewport width and connection speed
    const width = window.innerWidth;
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType || '4g';

    let source = sources.fallback;

    // Slow connection: always use mobile
    if (effectiveType === '2g' || effectiveType === '3g') {
      source = sources.mobile || sources.fallback;
    }
    // Mobile viewport
    else if (width < 768) {
      source = sources.mobile || sources.fallback;
    }
    // Tablet viewport
    else if (width < 1024) {
      source = sources.tablet || sources.desktop || sources.fallback;
    }
    // Desktop viewport
    else {
      source = sources.desktop || sources.fallback;
    }

    setSelectedSource(source);

    // Handle orientation/resize changes
    const handleResize = () => {
      const newWidth = window.innerWidth;
      // Trigger re-evaluation (would update source if needed)
      setSelectedSource(source);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sources]);

  return (
    <video
      ref={videoRef}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
      poster={poster}
      className="w-full h-full object-cover"
    >
      {selectedSource && (
        <source src={selectedSource} type="video/mp4" />
      )}
      <img src={poster} alt="Fallback" className="w-full h-full object-cover" />
    </video>
  );
}
```

### 3.3 Video Preloader Hook

```typescript
// app/hooks/useVideoPreloader.ts
import { useEffect, useState } from 'react';

export function useVideoPreloader(videoSrc: string, priority: 'high' | 'low' = 'low') {
  const [preloadStatus, setPreloadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  useEffect(() => {
    if (!videoSrc) return;

    setPreloadStatus('loading');

    // Use Fetch API to preload video
    fetch(videoSrc, {
      method: 'HEAD',
    })
      .then(() => setPreloadStatus('loaded'))
      .catch(() => setPreloadStatus('error'));

    // For priority videos, also preload in background using link rel="prefetch"
    if (priority === 'high' && typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'video';
      link.href = videoSrc;
      document.head.appendChild(link);
    }
  }, [videoSrc, priority]);

  return { preloadStatus };
}
```

---

## 4. Landing Page Integration Points

### 4.1 Hero Section (Above Fold)

```typescript
// app/sections/HeroSection.tsx
import { HeroWithVideo } from '@/components/HeroWithVideo';
import { useVideoPreloader } from '@/hooks/useVideoPreloader';

export function HeroSection() {
  const { preloadStatus } = useVideoPreloader('/videos/hero-epic-reveal.mp4', 'high');

  return (
    <section className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950 pt-20 pb-10">
      <div className="max-w-7xl w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Video Section */}
          <div className="order-1 lg:order-2">
            <HeroWithVideo
              videoSrc="/videos/hero-epic-reveal.mp4"
              fallbackImage="/images/BLEND2.png"
              autoPlay={true}
              muted={true}
              enableControls={true}
            />
          </div>

          {/* Copy Section */}
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
              K1-Lightwave
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                Edge-Lit Precision
              </span>
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              320 addressable RGB LEDs. Dual edge-lit design. 32cm of pure light.
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition">
                Reserve Now
              </button>
              <button className="px-8 py-3 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 font-semibold rounded-lg transition">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 4.2 Features Section (Mid-Page Showcase)

```typescript
// app/sections/FeaturesSection.tsx
export function FeaturesSection() {
  const features = [
    {
      title: 'Real-Time LED Control',
      description: 'Game-responsive animations synced to your screen',
      video: '/videos/gaming-performance.mp4',
      image: '/images/BLEND4.png',
      category: 'Performance',
    },
    {
      title: 'Ambient Breathing',
      description: 'Meditative light patterns for focus and mood',
      video: '/videos/hero-ambient-loop.mp4',
      image: '/images/BLEND3.png',
      category: 'Ambience',
    },
    {
      title: 'Developer-Friendly',
      description: 'Full API control, open-source firmware, 200+ examples',
      video: '/videos/developer-flex.mp4',
      image: '/images/BLEND9.png',
      category: 'Dev',
    },
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-white mb-16 text-center">
          What Makes K1-Lightwave Special
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-gray-800/50 backdrop-blur rounded-xl overflow-hidden hover:bg-gray-800 transition"
            >
              <div className="aspect-video bg-black relative">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  poster={feature.image}
                >
                  <source src={feature.video} type="video/mp4" />
                  <img src={feature.image} alt={feature.title} className="w-full h-full object-cover" />
                </video>
              </div>
              <div className="p-6">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  {feature.category}
                </span>
                <h3 className="text-xl font-bold text-white mt-2 mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 5. Performance Optimization Strategy

### 5.1 Video Codec Selection

| Format | Codec | Bitrate | File Size | Browser Support |
|--------|-------|---------|-----------|-----------------|
| **Primary** | H.264 | 2500 kbps | ~2.5 MB (8s) | 99% (all browsers) |
| **Modern** | H.265/HEVC | 1500 kbps | ~1.5 MB (8s) | 85% (Safari 11+, Edge 18+) |
| **Fallback** | VP9 | 2000 kbps | ~2.0 MB (8s) | 70% (Firefox, Chrome) |

**Recommendation:** Use H.264 as primary with H.265 as supplementary for modern browsers:

```html
<video autoPlay muted loop playsInline poster="/images/hero.png">
  <source src="/videos/hero-epic-reveal.mp4" type="video/mp4; codecs='hev1.1.6.L93.B0'" />
  <source src="/videos/hero-epic-reveal-h264.mp4" type="video/mp4; codecs='avc1.42E01E'" />
  <img src="/images/hero.png" alt="Fallback" />
</video>
```

### 5.2 Lazy Loading Strategy

```typescript
// Intersection Observer for video lazy loading
const observerOptions = {
  root: null,
  rootMargin: '50px', // Start loading 50px before entering viewport
  threshold: 0.01,
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const video = entry.target as HTMLVideoElement;
      if (video.dataset.src && !video.src) {
        video.src = video.dataset.src;
        video.load();
      }
      observer.unobserve(video);
    }
  });
}, observerOptions);

// Attach to all lazy videos
document.querySelectorAll('video[data-src]').forEach((v) => observer.observe(v));
```

### 5.3 Adaptive Bitrate Streaming (Optional)

For high-traffic sites, consider HLS (HTTP Live Streaming):

```typescript
// Install: npm install hls.js
import HLS from 'hls.js';

const video = document.querySelector('video');
const hlsUrl = '/videos/hero-epic-reveal.m3u8'; // Requires HLS packaging

if (HLS.isSupported()) {
  const hls = new HLS();
  hls.loadSource(hlsUrl);
  hls.attachMedia(video);
} else {
  video.src = '/videos/hero-epic-reveal.mp4'; // Fallback
}
```

### 5.4 Network-Aware Loading

```typescript
// Adjust quality based on network connection
const connection = (navigator as any).connection || {};
const effectiveType = connection.effectiveType;

const videoSrc = {
  '4g': '/videos/hero-epic-reveal-hq.mp4',     // 4Mbps+
  '3g': '/videos/hero-epic-reveal.mp4',         // 2Mbps
  '2g': '/videos/hero-epic-reveal-mobile.mp4',  // <1Mbps
};

const selectedVideo = videoSrc[effectiveType] || videoSrc['3g'];
```

---

## 6. Responsive Design Breakpoints

### 6.1 Video Dimensions by Viewport

```typescript
const breakpoints = {
  mobile: {
    width: 375,
    height: 667,
    maxFileSize: '1.5 MB',
    bitrate: '1500k',
  },
  tablet: {
    width: 768,
    height: 1024,
    maxFileSize: '2.5 MB',
    bitrate: '2000k',
  },
  desktop: {
    width: 1920,
    height: 1080,
    maxFileSize: '3 MB',
    bitrate: '2500k',
  },
};
```

### 6.2 Aspect Ratio Handling

```typescript
// CSS for maintaining aspect ratio without layout shift
const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;

  @media (max-width: 768px) {
    aspect-ratio: 1 / 1; // Square on mobile
  }

  video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
```

---

## 7. Testing Checklist

### 7.1 Video Playback Testing

- [ ] **Autoplay Behavior**
  - [ ] Desktop: Video autoplays muted in Chrome, Firefox, Safari
  - [ ] Mobile: Video shows poster, user tap required to play
  - [ ] iOS Safari: Respects autoplay-muted policy

- [ ] **Looping**
  - [ ] Seamless loop without black frame at transition
  - [ ] Loop restarts automatically after completion

- [ ] **Fallback**
  - [ ] Old browsers without H.264 support: Shows fallback image
  - [ ] Network error: Gracefully falls back to static image

### 7.2 Performance Testing

- [ ] **Page Load (SpeedInsights)**
  - [ ] LCP (Largest Contentful Paint): < 2.5s
  - [ ] CLS (Cumulative Layout Shift): < 0.1
  - [ ] FID (First Input Delay): < 100ms

- [ ] **Video Metrics**
  - [ ] TTFB (Time to First Byte): < 500ms
  - [ ] Time to start playing: < 1s
  - [ ] Memory usage: < 50MB per video instance

- [ ] **Bandwidth**
  - [ ] 4G: 30s page load time acceptable
  - [ ] 3G: Video queued, not blocking page interaction
  - [ ] Mobile 5G: Full quality available

### 7.3 Browser Compatibility

- [ ] Chrome 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Edge 90+
- [ ] Mobile Safari (iOS 13+)
- [ ] Chrome Android
- [ ] Firefox Android

### 7.4 Responsive Testing

- [ ] iPhone 12 Mini (375w)
- [ ] iPad (768w)
- [ ] MacBook Pro 13" (1280w)
- [ ] Desktop 1920x1080
- [ ] Ultrawide 3440x1440

---

## 8. Deployment Checklist

### 8.1 Pre-Deployment

- [ ] All 6 videos encoded and optimized via `Vid.optimisation.md` script
- [ ] Videos tested in browser dev tools (all codecs, all breakpoints)
- [ ] Performance budget met (LCP, CLS, FID within targets)
- [ ] Fallback images in place (all BLEND PNG files committed)
- [ ] React components built and tested locally

### 8.2 Deployment Steps

```bash
# 1. Optimize videos
bash K1-Assets/Vid.optimisation.md

# 2. Copy optimized videos to public folder
cp K1-Assets/02-ai-video-generation/raw-outputs/*optimized.mp4 app/public/videos/

# 3. Rename for clarity
mv app/public/videos/*epic*optimized.mp4 app/public/videos/hero-epic-reveal.mp4
mv app/public/videos/*ambient*optimized.mp4 app/public/videos/hero-ambient-loop.mp4
# ... etc

# 4. Update HTML/React with new video paths
# Edit: app/sections/HeroSection.tsx, FeaturesSection.tsx, etc.

# 5. Build and test
npm run build
npm run dev  # Test locally at http://localhost:3000

# 6. Deploy
npm run deploy  # Or your deployment script
```

### 8.3 Post-Deployment

- [ ] Verify videos load correctly on production domain
- [ ] Check Network tab for video HTTP status codes (200 OK)
- [ ] Monitor Sentry/LogRocket for video errors
- [ ] A/B test hero video vs ambient loop
- [ ] Track video engagement metrics (play %, completion %)
- [ ] Monitor CLS shift during video load

---

## 9. A/B Testing Framework

### 9.1 Video Variants

```typescript
// Variants to test:
const variants = {
  heroEpic: {
    video: '/videos/hero-epic-reveal.mp4',
    duration: '8s',
    type: 'high-energy',
    targetMetric: 'CTR',
  },
  heroAmbient: {
    video: '/videos/hero-ambient-loop.mp4',
    duration: '12s',
    type: 'calm',
    targetMetric: 'time-on-page',
  },
  heroStatic: {
    image: '/images/BLEND2.png',
    type: 'static',
    targetMetric: 'baseline',
  },
};
```

### 9.2 Analytics Integration

```typescript
// Track video engagement with GA4
function trackVideoEvent(videoName: string, action: string) {
  gtag('event', 'video_interaction', {
    video_name: videoName,
    action: action, // 'play', 'pause', 'complete', 'error'
    video_url: videoName,
    value: performance.now(),
  });
}

// Attach to video events
video.addEventListener('play', () => trackVideoEvent('hero-epic', 'play'));
video.addEventListener('pause', () => trackVideoEvent('hero-epic', 'pause'));
video.addEventListener('ended', () => trackVideoEvent('hero-epic', 'complete'));
```

---

## 10. Troubleshooting Guide

### Issue: Video Won't Autoplay

**Possible Causes:**
1. Not muted (autoplay requires muted)
2. User interaction not allowed yet (policy)
3. Video codec not supported

**Solutions:**
```typescript
// Always ensure muted for autoplay
<video autoPlay muted loop playsInline>
  <source src="/videos/hero.mp4" type="video/mp4" />
</video>

// Fallback if autoplay fails
video.autoplay = true;
video.muted = true;
const playPromise = video.play();
if (playPromise !== undefined) {
  playPromise
    .then(() => {
      // Autoplay succeeded
    })
    .catch((err) => {
      // Autoplay prevented - show poster image
      console.warn('Autoplay prevented:', err);
    });
}
```

### Issue: Black Frame at Loop Boundary

**Solution:** Ensure video is encoded with no keyframe at the exact end:
```bash
# Re-encode with -movflags +faststart
ffmpeg -i input.mp4 -c:v libx264 -movflags +faststart output.mp4
```

### Issue: High Memory Usage / Memory Leak

**Solution:** Properly cleanup video elements:
```typescript
useEffect(() => {
  return () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
      videoRef.current.load();
    }
  };
}, []);
```

### Issue: LCP Too High (> 2.5s)

**Solutions:**
1. Reduce video file size further (target 2MB max)
2. Use preload attribute: `<video preload="metadata">`
3. Defer non-critical sections below fold
4. Use blur-up placeholder while loading

---

## 11. Future Enhancements

### 11.1 Interactive Features

- [ ] **Music Sync:** Detect song BPM, sync LED animations
- [ ] **Music-Reactive:** User uploads music, K1 animates to beat
- [ ] **WebGL Visualization:** Real-time LED simulation on page
- [ ] **360° View:** Panoramic video of K1 rotating

### 11.2 Advanced Streaming

- [ ] **HLS/DASH:** Adaptive bitrate for large audiences
- [ ] **CloudFlare Stream:** Automatic optimization and analytics
- [ ] **Mux Video:** Professional video hosting with webhooks
- [ ] **On-Demand Encoding:** Dynamic quality based on device

### 11.3 Analytics Expansion

- [ ] **Video Heatmaps:** Where users scrub/seek
- [ ] **Engagement Scoring:** Weighted video interactions
- [ ] **Conversion Attribution:** Video watch → purchase tracking
- [ ] **Cohort Analysis:** Video variant performance by audience segment

---

## 12. Appendix: Video File Format Reference

### 12.1 Recommended FFmpeg Command

```bash
# Optimized H.264 encoding for web
ffmpeg -i input.mov \
  -c:v libx264 \
  -b:v 2500k \
  -maxrate 3000k \
  -bufsize 5000k \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -r 24 \
  -an \
  -preset slow \
  -profile:v high \
  -level 4.0 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  output.mp4
```

### 12.2 Mobile-Optimized Variant

```bash
# Lower bitrate for slower connections
ffmpeg -i input.mov \
  -c:v libx264 \
  -b:v 1500k \
  -maxrate 2000k \
  -vf "scale=1280:720" \
  -r 24 \
  -an \
  -preset fast \
  -movflags +faststart \
  output-mobile.mp4
```

### 12.3 H.265 Alternative

```bash
# Better compression (requires HEVC support)
ffmpeg -i input.mov \
  -c:v libx265 \
  -b:v 1500k \
  -vf "scale=1920:1080" \
  -r 24 \
  -an \
  -preset slow \
  -movflags +faststart \
  output-h265.mp4
```

---

## Document Info

**Version:** 1.0
**Last Updated:** 2025-11-19
**Author:** K1-Lightwave Landing Page Team
**Status:** Ready for Implementation
**Next Review:** Upon first video integration to production

---

## Quick Start for Developers

1. **Get Videos:** Collect AI-generated videos using prompts from `ai-video-generation-prompts.md`
2. **Optimize:** Run `bash Vid.optimisation.md` to encode all videos
3. **Copy:** Move optimized MP4s to `app/public/videos/`
4. **Integrate:** Update `HeroSection.tsx` with video paths
5. **Test:** Run `npm run dev`, verify playback and performance
6. **Deploy:** Build and push to production
7. **Monitor:** Track video engagement and performance metrics

