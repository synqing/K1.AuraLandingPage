# Shiny CTA Button: Quick Reference Guide

## One-Line Summaries

| Component | What It Does | Key Property | Duration |
|-----------|-------------|--------------|----------|
| `@property --gradient-angle` | Enables smooth angle interpolation | `syntax: "<angle>"` | N/A |
| `@keyframes border-spin` | Rotates conic gradient 360° | `--gradient-angle: 360deg` | 2.5s |
| `.shiny-cta` dual-layer background | Creates black interior + animated border | `padding-box` / `border-box` layers | N/A |
| `::before` pseudo-element | Tiny sparkles synchronized with border | Radial gradient + conic mask | 2.5s (sync) |
| `::after` pseudo-element | Diagonal light beam | Linear gradient + radial mask | 4.0s (async) |
| `span::before` | Pulsing glow behind text | Radial gradient + opacity animation | 4.5s (async) |

## Critical Concepts

### 1. @property Registration
```css
@property --gradient-angle {
  syntax: "<angle>";        /* Type: enables interpolation */
  initial-value: 0deg;      /* Default value */
  inherits: false;          /* Don't pass to children */
}
```
**Why**: CSS treats custom properties as strings by default. @property enables smooth transitions between angle values.

### 2. Dual-Layer Background Strategy
```css
background:
  linear-gradient(#000, #000) padding-box,     /* Layer 1: Black interior */
  conic-gradient(...) border-box;              /* Layer 2: Animated border */
```
**Why**: `padding-box` hides the gradient in the interior. `border-box` shows it only in the border area.

### 3. Mask-Image vs Background
```
mask-image = VISIBILITY controller
  Black = visible (100% opacity)
  Transparent = hidden (0% opacity)
  Gray = semi-visible

background = COLOR fill
  Adds color/gradient to element
```

### 4. Three Independent Animation Timings
```
Border-spin:  2.5s (fast, primary visual)
Shimmer:      4.0s (medium, depth effect)
Breathing:    4.5s (slow, energy effect)

LCM = 10.0s (pattern repeats every 10 seconds)
```

## CSS Syntax Reference

### Conic-Gradient (Border Light)
```css
conic-gradient(
  from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
                              ↑
                    Rotating starting point
  transparent 0%,
  #1d4ed8 5%,
  var(--gradient-shine) 15%,
  #1d4ed8 30%,
  transparent 40%,            ← 40° wedge of light
  transparent 100%
)
```

### Radial-Gradient (Particle Shimmer)
```css
radial-gradient(
  circle at var(--position) var(--position),
                          ↑
                    Center of sparkle
  white 0.5px,      ← 0.5px radius white dot
  transparent 0     ← Instantly transparent after
)
```

### Linear-Gradient (Directional Shimmer)
```css
linear-gradient(
  -50deg,           ← Diagonal angle (↖↘ direction)
  transparent,      ← Fades in
  #1d4ed8,         ← Bright in middle
  transparent       ← Fades out
)
```

### Mask Gradient (Visibility Control)
```css
/* Conic mask for particle: rotating spotlight */
mask-image: conic-gradient(
  from calc(var(--gradient-angle) + 45deg),
  black,                ← Visible
  transparent 10% 90%, ← Hidden (80° arc)
  black                 ← Visible
);

/* Radial mask for shimmer: cone shape */
mask-image: radial-gradient(
  circle at bottom,    ← Center at bottom
  transparent 40%,     ← Hide top 40%
  black                ← Show bottom 60%
);
```

### Animation Declaration
```css
animation:
  border-spin          /* name */
  2.5s                 /* duration */
  linear               /* timing function (no easing) */
  infinite;            /* iteration (loop forever) */
```

### Transform Translate Pattern
```css
transform: translate(-100%, -100%);
          ↑                  ↑
    Moves left by width  Moves up by height
    Result: Centers element at reference point
```

## Modification Guide

### Change Border Light Color
```css
/* In conic-gradient */
#1d4ed8 → #06b6d4  /* Blue to Cyan */
var(--gradient-shine) → var(--gradient-shine)  /* Use CSS variable */
```

### Change Animation Speed
```css
/* Faster border rotation */
animation: border-spin 1.5s linear infinite;  /* 2.5s → 1.5s */

/* Faster shimmer */
@keyframes shimmer {
  0% { transform: translate(-100%, -100%); }
  100% { transform: translate(100%, 100%); }
}
animation: shimmer 2s linear infinite;  /* 4s → 2s */

/* Faster breathing */
animation: breathe 2.5s linear infinite;  /* 4.5s → 2.5s */
```

### Change Particle Intensity
```css
/* Smaller particle (less visible) */
white 0.3px,       /* 0.5px → 0.3px */
transparent 0

/* Larger particle (more visible) */
white 1px,         /* 0.5px → 1px */
transparent 0
```

### Change Glow Intensity
```css
/* Dimmer glow */
rgba(29, 78, 216, 0.15),   /* 0.3 opacity → 0.15 */
transparent 70%

/* Brighter glow */
rgba(29, 78, 216, 0.5),    /* 0.3 opacity → 0.5 */
transparent 70%
```

### Change Light Position
```css
/* Different starting angle */
from calc(var(--gradient-angle) - 0deg)    /* Aligned with center */
from calc(var(--gradient-angle) - 45deg)   /* 45° offset */
```

### Change Shimmer Angle
```css
/* Vertical sweep (top to bottom) */
background: linear-gradient(90deg, transparent, #1d4ed8, transparent);

/* Horizontal sweep (left to right) */
background: linear-gradient(0deg, transparent, #1d4ed8, transparent);

/* Steeper angle (more diagonal) */
background: linear-gradient(-70deg, transparent, #1d4ed8, transparent);
```

## Debugging Checklist

### Animation Not Showing?
- [ ] Check `@property` is declared before use
- [ ] Check animation duration is not 0s
- [ ] Check z-index layering (pseudo-elements behind text?)
- [ ] Check browser support (see compatibility table)
- [ ] Check CSS syntax for typos in gradient stops

### Shimmer Looks Choppy?
- [ ] Check `linear` timing function is used (not `ease`)
- [ ] Check animation duration is reasonable (2-4s)
- [ ] Check GPU acceleration enabled (should be automatic)
- [ ] Check browser performance (lower frame rate causes chop)

### Color Not Changing?
- [ ] Check hex color syntax (#1d4ed8 format)
- [ ] Check variable name spelling
- [ ] Check conic-gradient vs linear-gradient usage
- [ ] Check mask-image doesn't override color (use black/transparent in masks)

### Glow Behind Text Invisible?
- [ ] Check `z-index: -1` on span::before
- [ ] Check opacity isn't 0
- [ ] Check radial-gradient center is correct
- [ ] Check inset value extends beyond text

### Particle Not Visible?
- [ ] Check ::before pseudo-element has `content: ''`
- [ ] Check position is `absolute`
- [ ] Check width/height is 100%
- [ ] Check mask-image doesn't set transparency to 0%
- [ ] Check radial-gradient center position

## Performance Tips

### Best Practices
1. Use `linear` timing function (less CPU than easing functions)
2. Limit to 4 simultaneous animations (this button is at the limit)
3. Use different durations to avoid synchronization overhead
4. Test on mobile devices (they have lower animation budgets)

### Optimization Opportunities
```css
/* Use will-change carefully (enables GPU acceleration) */
.shiny-cta {
  will-change: background, transform;
}

/* But remove it when animation ends to free up GPU memory */
.shiny-cta:hover {
  will-change: auto;
}

/* Use transform instead of top/left for pseudo-element translation */
/* ✓ Good: transform (GPU accelerated) */
/* ✗ Bad: top/left (CPU intensive) */
```

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| @property | 88+ | 128+ | 15.4+ | 88+ |
| conic-gradient | 76+ | 83+ | 12.1+ | 76+ |
| mask-image | All* | All* | All* | All* |
| transform | All* | All* | All* | All* |
| animation | All* | All* | All* | All* |

*Modern versions (2020+)

For older browsers, provide a fallback:
```css
.shiny-cta {
  /* Fallback for browsers without @property support */
  background: linear-gradient(#000, #000) padding-box,
              conic-gradient(
                from 0deg,  /* Static gradient, no animation */
                transparent 0%,
                #1d4ed8 5%,
                #1d4ed8 30%,
                transparent 40%,
                transparent 100%
              ) border-box;

  /* Modern browsers override with this */
  @supports (background-clip: border-box) and (animation: test 1s) {
    animation: border-spin 2.5s linear infinite;
  }
}
```

## Common Use Cases

### Make Button More Subtle
```css
/* Reduce all effect intensities */
.shiny-cta::before { opacity: 0.3; }          /* Dimmer particle */
.shiny-cta::after { opacity: 0.3; }           /* Dimmer shimmer */
.shiny-cta span::before { opacity: 0.15; }    /* Dimmer glow */
animation: border-spin 4s linear infinite;    /* Slower rotation */
```

### Make Button More Dramatic
```css
/* Increase all effect intensities */
.shiny-cta::before { opacity: 1; }            /* Brighter particle */
.shiny-cta::after { opacity: 1; }             /* Brighter shimmer */
.shiny-cta span::before { opacity: 0.6; }     /* Brighter glow */
animation: border-spin 1.5s linear infinite;  /* Faster rotation */
```

### Multiple Particles Instead of One
```css
/* Add more radial gradients (comma-separated) */
background:
  radial-gradient(circle at 30% 40%, white 0.5px, transparent 0),
  radial-gradient(circle at 70% 60%, white 0.5px, transparent 0),
  radial-gradient(circle at 50% 80%, white 0.5px, transparent 0);

/* All particles share the same conic mask, so they pulse together */
```

### Sync All Animations (Simpler Pattern)
```css
/* Use same duration for all animations to sync them */
.shiny-cta {
  animation: border-spin 4s linear infinite;  /* 4s */
}

.shiny-cta::after {
  animation: shimmer 4s linear infinite;      /* 4s - SAME */
}

.shiny-cta span::before {
  animation: breathe 4s linear infinite;      /* 4s - SAME */
}

/* Pattern repeats every 4s instead of 10s (simpler, more predictable) */
```

## Common Mistakes to Avoid

### ✗ WRONG: Using ease timing function
```css
animation: border-spin 2.5s ease infinite;  /* ✗ Creates visible speed changes */
```
**Better**: `linear` - constant speed

### ✗ WRONG: Not using @property
```css
@keyframes border-spin {
  to { --gradient-angle: 360deg; }  /* ✗ Jumps between frames */
}
```
**Better**: Declare `@property --gradient-angle` first

### ✗ WRONG: Forgetting content: ''
```css
.shiny-cta::before {
  /* ✗ No pseudo-element shows up without content */
}
```
**Better**: `content: ''; position: absolute;`

### ✗ WRONG: Using transform: rotate on gradient
```css
.shiny-cta {
  background: conic-gradient(...);
  transform: rotate(var(--gradient-angle));  /* ✗ Rotates whole button */
}
```
**Better**: Use `from calc(var(--gradient-angle) - offset)` in gradient itself

### ✗ WRONG: Mask with color instead of grayscale
```css
mask-image: linear-gradient(to right, red 50%, blue 100%);
/* ✗ Colors are ignored in masks, only luminance matters */
```
**Better**: Use `black` (visible) and `transparent` (hidden)

---

## Real-World Integration Example

```html
<style>
  @property --gradient-angle {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  @keyframes border-spin {
    to { --gradient-angle: 360deg; }
  }

  @keyframes shimmer {
    0% { transform: translate(-100%, -100%); }
    100% { transform: translate(100%, 100%); }
  }

  @keyframes breathe {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.8; }
  }

  .shiny-cta {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    border: 2px solid transparent;
    border-radius: 8px;
    background:
      linear-gradient(#000000, #000000) padding-box,
      conic-gradient(
        from calc(var(--gradient-angle) - 0deg),
        transparent 0%,
        #1d4ed8 5%,
        #1d4ed8 15%,
        #1d4ed8 30%,
        transparent 40%,
        transparent 100%
      ) border-box;
    animation: border-spin 2.5s linear infinite;
    overflow: hidden;
    z-index: 1;
  }

  .shiny-cta::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 50% 50%, white 0.5px, transparent 0);
    mask-image: conic-gradient(
      from calc(var(--gradient-angle) + 45deg),
      black,
      transparent 10% 90%,
      black
    );
    pointer-events: none;
    z-index: 2;
  }

  .shiny-cta::after {
    content: '';
    position: absolute;
    top: -100%;
    left: -100%;
    width: 300%;
    height: 300%;
    background: linear-gradient(
      -50deg,
      transparent,
      #1d4ed8,
      transparent
    );
    mask-image: radial-gradient(circle at bottom, transparent 40%, black);
    animation: shimmer 4s linear infinite;
    pointer-events: none;
    z-index: 2;
  }

  .shiny-cta span {
    position: relative;
    z-index: 3;
  }

  .shiny-cta span::before {
    content: '';
    position: absolute;
    inset: -4px;
    background: radial-gradient(
      ellipse at center,
      rgba(29, 78, 216, 0.3),
      transparent 70%
    );
    animation: breathe 4.5s linear infinite;
    pointer-events: none;
    z-index: -1;
    border-radius: 4px;
  }
</style>

<a href="#" class="shiny-cta"><span>Click Me</span></a>
```

This is the complete, production-ready implementation with all components working together.
