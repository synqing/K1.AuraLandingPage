# Shiny Button: Animation Mechanics - Visual Guide

## 1. @property Registration Mechanism

### How @property Enables Smooth Transitions

```
WITHOUT @property (CSS treats --gradient-angle as a string):
─────────────────────────────────────────────────────────

Animation Progress: 0%          25%         50%         75%         100%
--gradient-angle value:   "0deg"       "90deg"    "180deg"    "270deg"    "360deg"
                           ↓             ↓           ↓           ↓           ↓
Browser interpolation:  NONE       NONE       NONE       NONE       NONE
                        (jumps)    (jumps)    (jumps)    (jumps)    (jumps)

Visual result: Jerky, choppy animation. Border light snaps between positions.


WITH @property syntax: "<angle>" (CSS recognizes --gradient-angle as an angle):
─────────────────────────────────────────────────────────

Animation Progress: 0%   12.5%    25%   37.5%   50%   62.5%   75%   87.5%   100%
--gradient-angle:    0°   45°     90°   135°    180°   225°    270°   315°   360°
Browser interpolation: ✓    ✓      ✓     ✓      ✓     ✓       ✓     ✓      ✓
                      (smooth interpolation between all values)

Visual result: Smooth, fluid animation. Border light rotates continuously.
```

### @property Declaration Structure

```
@property --gradient-angle {
  ├── syntax: "<angle>";
  │   └── Tells browser: "This variable holds angle values"
  │       Enables interpolation: 0° → 1° → 2° → ... → 360°
  │
  ├── initial-value: 0deg;
  │   └── Default value if not set on element
  │       Prevents browser errors if --gradient-angle not defined
  │
  └── inherits: false;
      └── Children of .shiny-cta DON'T inherit --gradient-angle
          Keeps animation scoped to button only
```

---

## 2. Conic-Gradient Border Animation

### Visual: What a Conic-Gradient Is

```
Linear Gradient (top to bottom):        Radial Gradient (center out):
┌──────────────────┐                    ┌──────────────────┐
│ ████████████████ │ (white, 100%)      │        ████ (W)  │
│ ████████████████ │ (gray, 75%)        │      ████░░░░    │
│ ░░░░░░░░░░░░░░░░ │ (gray, 50%)        │    ████░░░░░░░   │
│ ░░░░░░░░░░░░░░░░ │ (black, 0%)        │    ░░░░░░░░░░░   │
└──────────────────┘ (↓ direction)      └──────────────────┘ (↗ direction)


Conic-Gradient (360° rotation):         Rotating Conic (animation):
┌──────────────────┐                    Frame 0:    Frame 90°:   Frame 180°:
│    B      Y      │ (like a color      ┌──────┐   ┌──────┐      ┌──────┐
│  B        Y      │  wheel, rotating   │ ████ │   │  ██  │      │     ██│
│ B          Y     │  around center)    │████  │   │  ██  │      │    ███│
│ M          G     │                    │██    │   │  ██  │      │      █│
│ M          G     │                    └──────┘   └──────┘      └──────┘
│ C          C     │
└──────────────────┘
```

### Conic-Gradient in This Button

```
@property --gradient-angle {
  syntax: "<angle>";
  initial-value: 0deg;
}

.shiny-cta {
  border: 2px solid transparent;
  background:
    linear-gradient(#000, #000) padding-box,
    conic-gradient(
      from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
      ↓
      The starting angle of the conic gradient rotates!
      Starting at 0° initially, then 90°, then 180°, then 270°, then back to 0°

      transparent 0%,
      ↓
      0° to 5° arc: transparent (hidden)

      #1d4ed8 5%,
      ↓
      5°: blue light starts

      var(--gradient-shine) 15%,
      ↓
      15°: peak brightness

      #1d4ed8 30%,
      ↓
      30°: blue fades

      transparent 40%,
      ↓
      40° to 100° arc: transparent (hidden)
    ) border-box;

  animation: border-spin 2.5s linear infinite;
}

@keyframes border-spin {
  from { --gradient-angle: 0deg; }
  to { --gradient-angle: 360deg; }
}
```

### Animation Timeline: How the Light Rotates

```
TIME: 0.0s (--gradient-angle: 0deg, starting from top)
┌──────────────┐
│     ██       │ ← Light starts at top (0°)
│              │
│              │
│              │
└──────────────┘

TIME: 0.625s (--gradient-angle: 90deg, starting from right)
┌──────────────┐
│              │
│           ██ │ ← Light is now on right side (90°)
│              │
│              │
└──────────────┘

TIME: 1.25s (--gradient-angle: 180deg, starting from bottom)
┌──────────────┐
│              │
│              │
│              │
│     ██       │ ← Light is now at bottom (180°)
└──────────────┘

TIME: 1.875s (--gradient-angle: 270deg, starting from left)
┌──────────────┐
│              │
│ ██           │ ← Light is now on left side (270°)
│              │
│              │
└──────────────┘

TIME: 2.5s (--gradient-angle: 360deg = 0deg, back at top)
┌──────────────┐
│     ██       │ ← Light completes rotation, back to top
│              │
│              │
│              │
└──────────────┘

(Cycle repeats immediately)
```

### Understanding the Gradient Distribution

```
Conic-gradient color stops:

transparent 0% ........... transparent 40%
    ↓                            ↓
    0° arc                     40° arc
    ↓                            ↓
    ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
    0°2° 4°6° ... 38°40° ....... 360° (0°)
         ↑       ↑   ↑              ↑
    Hidden  Light   Fade       Back to hidden

Blue light exists in the 40° wedge at any rotation:
- 0° to 5°: Transparent (entering)
- 5° to 15°: Blue (bright region)
- 15° to 30°: Still blue (fading)
- 30° to 40°: Transparent (exiting)
- 40° to 360°: Completely transparent (360° arc of darkness)
```

---

## 3. Particle Shimmer: Radial Gradient + Conic Mask

### The Radial Gradient: Creating the Sparkle

```
What a 0.5px white particle looks like under magnification:

Normal size (1px button area):
┌─┐
│█│ ← One white pixel (0.5px radius circle)
└─┘

Zoomed in 100x:
┌──────────────────────────────────┐
│                                  │
│           transparent             │
│                                  │
│          ┌──────────┐            │
│          │          │            │
│          │   ████   │            │ ← 1px diameter
│          │   ████   │            │    (0.5px radius)
│          │          │            │
│          └──────────┘            │
│                                  │
│           transparent             │
│                                  │
└──────────────────────────────────┘

radial-gradient(circle at center, white 0.5px, transparent 0)
                                    ↓                      ↓
                            Opaque white zone     Instantly transparent
                            (0 to 0.5px radius)   (beyond 0.5px)
```

### The Conic Mask: Creating the Spotlight

```
The mask controls VISIBILITY (not color):
black = 100% visible
transparent = 0% visible
gray = semi-visible

Conic Mask Visualization (looking down from above):

Without mask:
┌──────────────────┐
│                  │
│     Particle     │ Particle always visible
│     (white dot)  │ at the center
│                  │
└──────────────────┘


With rotating conic mask (from var(--gradient-angle) + 45deg):
┌──────────────────┐
│                  │
│ ▓▓▓▓▓▓▓         │ Visible (black in mask)
│▓▓   Particle▓▓▓▓│ Particle is visible here
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ because mask is black
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ Hidden (transparent in mask)
│         ▓▓▓▓▓  │
│                │
└──────────────────┘

  ▓▓ = areas where mask is black (visible)
  □ = areas where mask is transparent (hidden)


As animation progresses, the black wedge rotates:

Frame 1: Black wedge at top        Frame 2: Wedge rotated 45°
┌──────────────────┐              ┌──────────────────┐
│ ▓▓▓Particle▓▓▓  │              │         ▓▓▓       │
│               ▓▓│              │   Particle ▓▓▓   │
│                  │              │          ▓▓     │
│                  │              │     ▓▓▓▓▓        │
└──────────────────┘              └──────────────────┘
Particle visible              Particle partially visible
(wedge covers it)             (wedge moving away)

Frame 3: Wedge rotated 90°      Frame 4: Wedge rotated 135°
┌──────────────────┐              ┌──────────────────┐
│                  │              │     ▓▓           │
│                  │              │▓▓▓ Particle      │
│                  │              │▓▓▓▓▓▓            │
│           ▓ Particle            │  ▓▓▓▓▓          │
└──────────────────┘              └──────────────────┘
Particle invisible              Particle becoming visible
(black region rotated away)     (wedge returning)
```

### Mask Details: The 10% 90% Pattern

```
Standard conic mask:

mask-image: conic-gradient(
  from calc(var(--gradient-angle) + 45deg),
  black,
  transparent 10% 90%,  ← What does this mean?
  black
);

Explanation of "transparent 10% 90%":
This is shorthand for:
  - transparent 10% (start of transparent region)
  - transparent 90% (end of transparent region)

Which means:
- 0% to 10%: black (visible) - 40° wedge
- 10% to 90%: transparent (hidden) - 320° dark region
- 90% to 100%: black (visible) - 40° wedge

So the mask shows visibility in a 40° wedge, with 320° dark region.

Visualization:

        0°
        █ (visible)
        █ (visible)
       ██ (10° mark: becomes transparent)
       ░░
       ░░ (transparent)
       ░░
       ░░ (90° mark: becomes visible again)
        ██
        █ (visible)
        █ (visible)
```

### Combined Effect: Particle + Mask in Action

```
The particle (white dot) exists at the center, but:
- It only appears to exist when the mask's black wedge passes over it
- As the black wedge rotates, the particle appears to "blink"

Timeline:

0.0s: Mask at 0°-40° wedge
┌──────────────┐
│ ★ Particle ★ │ ← Visible! (wedge is here)
│              │
└──────────────┘

0.3s: Mask at 45°-85° wedge
┌──────────────┐
│              │
│    (no ★)    │ ← Invisible (wedge rotated away)
│              │
└──────────────┘

0.6s: Mask at 90°-130° wedge
┌──────────────┐
│              │
│    (no ★)    │ ← Still invisible
│              │
└──────────────┘

1.25s: Mask at 180°-220° wedge
┌──────────────┐
│              │
│    (no ★)    │ ← Still invisible (opposite side)
│              │
└──────────────┘

1.875s: Mask at 270°-310° wedge
┌──────────────┐
│ ★ Particle ★ │ ← Visible again! (wedge returning)
│              │
└──────────────┘

2.5s: Complete rotation, back to 0°-40°
┌──────────────┐
│ ★ Particle ★ │ ← Cycle repeats
│              │
└──────────────┘
```

---

## 4. Directional Shimmer: Linear Gradient + Radial Mask

### The Oversized Pseudo-Element Strategy

```
The pseudo-element is 3×3 the button size, positioned at top-left -100%:

Button position:         Pseudo-element position:
(relative to parent)     (relative to parent)

      (100%, 100%)            (-100%, -100%)
           ↓                         ↓
           E                         ┌────────────────────────┐
           ↑                         │                        │
           └──────────┐             │      Pseudo-element    │
                      │             │      (300% × 300%)     │
            ┌─────────┴────────┐    │                        │
            │ Button (100%)    │    │  ┌──────────────────┐  │
            │                  │    │  │    Button area   │  │
            │                  │    │  │   (100% × 100%)  │  │
            │                  │    │  └──────────────────┘  │
            └──────────────────┘    │                        │
                                    │                        │
                                    └────────────────────────┘

Translation animation moves pseudo-element from:
translate(-100%, -100%)  →  translate(100%, 100%)

Which means:
Start position:    Diagonal sweep path:        End position:
┌────────────────┐  ↙ ↙ ↙ ↙ ↙ ↙ ↙         ┌────────────────┐
│■·····┌──────┐ │  ↙ ↙ ↙ ↙ ↙ ↙ ↙         │      ┌──────┐■│
│·····╱│Button│ │  ↙ ↙ ↙ ↙ ↙ ↙ ↙         │      │Button╱·│
│····╱ │      │ │  ↙ ↙ ↙ ↙ ↙ ↙ ↙         │      │     ╱··│
│───╱──└──────┘ │  ↙ ↙ ↙ ↙ ↙ ↙ ↙         │      └────╱───│
│──╱            │  ↙ ↙ ↙ ↙ ↙ ↙ ↙         │         ╱────│
│─╱             │  ↙ ↙ ↙ ↙ ↙ ↙ ↙         │        ╱─────│
│╱              │  ↙ ↙ ↙ ↙ ↙ ↙ ↙         │      ╱───────■│
└────────────────┘                       └────────────────┘

The ■ represents the gradient light traveling diagonally.
```

### The Linear Gradient: Creating the Light Beam

```
background: linear-gradient(
  -50deg,              ← Angle of gradient stripes
  transparent,         ← Color at starting edge
  #1d4ed8,            ← Color in middle (bright)
  transparent         ← Color at ending edge
);

Visual representation (-50° angle):

Angled at -50° (↖↘ direction):
┌──────────────────────────────────┐
│ transparent edge  ↑              │
│                   │              │
│  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ← Blue light    │ Stripe at
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ← Brightest     │ -50° angle
│  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ← Blue light    │
│                   │              │
│ transparent edge  ↓              │
└──────────────────────────────────┘

The stripe is diagonal, like light from a distant source.
```

### The Radial Mask: Creating the Cone Shape

```
mask-image: radial-gradient(
  circle at bottom,    ← Center at button's bottom edge
  transparent 40%,     ← Hide the top 40%
  black                ← Show the bottom 60%
);

Visual representation:

Top view of button with mask applied:

Without mask:           With mask (circle at bottom):
┌──────────────┐       ┌──────────────┐
│ transparent  │       │ ░░░░░░░░░░░░ │ ← Hidden (40% from center)
│              │       │ ░░░░░░░░░░░░ │
│ (blue light) │       │ ░░░░░░░░░░░░ │
│              │       │ ░░░░░░░░░░░░ │
│ visible      │  →    │ ████████████ │ ← Visible (beyond 40%)
│              │       │ ███[Center]██│ (expanding cone from bottom)
│              │       │ ████████████ │
│              │       │ ███████████  │
└──────────────┘       └──────────────┘

The "cone" forms because:
- circle at bottom: The center of the expanding circle is at the button's bottom
- 0% radius (center): Button's bottom edge
- 40% radius: Extends 40% of button height upward (hidden)
- 100% radius: Extends beyond button (visible)

Result: A cone shape with apex at bottom, expanding upward. Only the
expanding bottom portion is visible (like light from a lamp above).
```

### Animation Timeline: Diagonal Sweep

```
Keyframe animation:

@keyframes shimmer {
  0% {
    transform: translate(-100%, -100%);  ← Top-left
  }
  100% {
    transform: translate(100%, 100%);    ← Bottom-right
  }
}

Timeline visualization (4.0 second duration):

t=0.0s: translate(-100%, -100%)
┌──────────────────────────────────┐
│                                  │
│ ■ Gradient off-screen            │
│  \                               │
│   \ (entering)                   │
│    \                             │
│     \                            │
│      \                           │
│       \                          │
└──────────────────────────────────┘

t=1.0s: translate(-25%, -25%)
┌──────────────────────────────────┐
│       ■ ■ ■ ■ ■                │
│      ■ ■ ■ ■ ■ ■               │
│     ■ ■ ■ ■ ■ ■ ■              │
│    ■ ■ ■ ■ ■ ■ ■ ■            │ Gradient moving
│   ■ ■ ■ ■ ■ ■ ■ ■ ■           │ through button
│  ■ ■ ■ ■ ■ ■ ■ ■ ■ ■          │
└──────────────────────────────────┘

t=2.0s: translate(50%, 50%)
┌──────────────────────────────────┐
│                                  │
│                   ■ ■ ■ ■ ■     │
│                  ■ ■ ■ ■ ■ ■    │
│                 ■ ■ ■ ■ ■ ■ ■   │ Gradient near
│                ■ ■ ■ ■ ■ ■ ■ ■  │ bottom-right
│               ■ ■ ■ ■ ■ ■ ■ ■   │
└──────────────────────────────────┘

t=3.0s: translate(75%, 75%)
┌──────────────────────────────────┐
│                                  │
│                                  │
│                                  │
│                   ■ ■ ■ ■ ■ ■   │ Gradient mostly
│                  ■ ■ ■ ■ ■ ■ ■\ │ off-screen
│                 ■ ■ ■ ■ ■ ■ ■ \│
└──────────────────────────────────┘

t=4.0s: translate(100%, 100%)
┌──────────────────────────────────┐
│                                  │
│                                  │
│                                  │
│                                  │ Gradient off-screen
│                                  │ (bottom-right)
│                                  │
│                             ■ ■ \│
└──────────────────────────────────┘
(Cycle repeats immediately)
```

---

## 5. Breathing Glow: Pulsing Opacity

### The Glow Shape

```
span element with text:        span::before pseudo-element:
("Click Me")                   (glow halo)

         └─ Click Me ─┘
        (12px text)

Pseudo-element is positioned absolutely at:
inset: -4px (4px beyond text in all directions)

       ┌──────────────────┐
       │                  │
       │   ┌─ Click Me ─┐ │ ← Glow extends 4px
       │   │            │ │   beyond text edges
       │   └──────────────┘ │
       │                  │
       └──────────────────┘

Radial gradient fills this area with blue that fades outward:
      ┌──────────────┐
      │ ████ (opaque)│
      │ ██░░░░░░░░██│ ← Text sits here
      │ ██░░░░░░░░██│
      │ ████░░░░████│
      │  ████████   │
      │   ████████  │
      │    ██████   │
      └──────────────┘
        (fades to 0% opacity)
```

### Breathing Animation

```
opacity oscillates: 0.3 → 0.8 → 0.3 → 0.8 ...

@keyframes breathe {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.8;
  }
}

animation: breathe 4.5s linear infinite;

Timeline (4.5 second cycle):

t=0.0s:  opacity: 0.3  ↑ (dimmest)
         ░░░░░░░░░░░░
         ░░ Click ░░░░
         ░░░░░░░░░░░░

t=1.125s: opacity: 0.55 ↑ (interpolated)
         ████████████
         ██ Click ████
         ████████████

t=2.25s: opacity: 0.8  ↑ (brightest)
         ▓▓▓▓▓▓▓▓▓▓▓▓
         ▓▓ Click ▓▓▓▓
         ▓▓▓▓▓▓▓▓▓▓▓▓

t=3.375s: opacity: 0.55 ↑ (interpolated)
         ████████████
         ██ Click ████
         ████████████

t=4.5s: opacity: 0.3  ↑ (dimmest, cycle repeats)
         ░░░░░░░░░░░░
         ░░ Click ░░░░
         ░░░░░░░░░░░░

Legend:
▓▓ = high opacity (0.8)
████ = medium opacity (0.55)
░░░░ = low opacity (0.3)
```

---

## 6. Master Timeline: All Animations Together

```
Four animations at different frequencies create a complex, non-repeating pattern:

┌──────────────────────────────────────────────────────────────────────────────┐
│ UNIFIED ANIMATION TIMELINE (0 to 10 seconds - LCM of 2.5, 4, 4.5)           │
└──────────────────────────────────────────────────────────────────────────────┘

BORDER-SPIN (2.5s cycle):
├─ 0→2.5s:     0° → 360° (rotation 1)      ▓▓▓▓▓▓▓▓▓▓
├─ 2.5→5.0s:   0° → 360° (rotation 2)      ▓▓▓▓▓▓▓▓▓▓
├─ 5.0→7.5s:   0° → 360° (rotation 3)      ▓▓▓▓▓▓▓▓▓▓
├─ 7.5→10s:    0° → 360° (rotation 4)      ▓▓▓▓▓▓▓▓▓▓
└─ Completes 4 full rotations

SHIMMER (4.0s cycle):
├─ 0→4.0s:     -100% → 100% (sweep 1)      ░░░░░░░░░░░░░░░░
├─ 4.0→8.0s:   -100% → 100% (sweep 2)      ░░░░░░░░░░░░░░░░
├─ 8.0→10s:    -100% → 50% (sweep 3, partial)
└─ Completes 2.5 full sweeps

BREATHING (4.5s cycle):
├─ 0→4.5s:     0.3 → 0.8 → 0.3 (pulse 1)   ████████████████████
├─ 4.5→9.0s:   0.3 → 0.8 → 0.3 (pulse 2)   ████████████████████
├─ 9.0→10s:    0.3 → 0.4 (pulse 3, partial)
└─ Completes 2.22 full pulses

At t=10.0s: All animations reset to their initial state

┌──────────────────────────────────────────────────────────────────────────────┐
│ FRAME-BY-FRAME BREAKDOWN (Selected key moments)                              │
└──────────────────────────────────────────────────────────────────────────────┘

t=0.0s (All start)
BORDER-SPIN:  0° (top)
SHIMMER:      -100% (off-screen, top-left)
BREATHING:    opacity: 0.3 (dim)
PERCEPTION:   Border light starts at top. Shimmer entering from corner. Glow dim.

t=1.0s (1/2.5 = 40% of border cycle)
BORDER-SPIN:  144° (right side)
SHIMMER:      -50% (moving through button)
BREATHING:    opacity: 0.47 (getting brighter)
PERCEPTION:   Border light on right. Beam moving diagonally. Glow brightening.

t=2.5s (BORDER completes 1 cycle)
BORDER-SPIN:  0° (back to top, RESETS)
SHIMMER:      62.5% (lower-right area)
BREATHING:    opacity: 0.45 (dimming again)
PERCEPTION:   Border light returns to top. Beam near exit. Glow fading.

t=4.0s (SHIMMER completes 1 cycle)
BORDER-SPIN:  230° (left-ish side)
SHIMMER:      -100% (off-screen again, RESETS)
BREATHING:    opacity: 0.7 (brightening again)
PERCEPTION:   Border light on different side. Shimmer re-enters. Glow bright.

t=4.5s (BREATHING completes 1 cycle)
BORDER-SPIN:  259° (left side, nearly 270°)
SHIMMER:      12.5% (starting to enter)
BREATHING:    opacity: 0.3 (back to dim, RESETS)
PERCEPTION:   Border light on left. Shimmer entering again. Glow resets to dim.

t=10.0s (LCM - all animations reset)
BORDER-SPIN:  0° (RESET)
SHIMMER:      -100% (RESET)
BREATHING:    opacity: 0.3 (RESET)
PERCEPTION:   Pattern repeats exactly. This is where cycle starts again.

┌──────────────────────────────────────────────────────────────────────────────┐
│ INTERFERENCE PATTERN VISUALIZATION                                           │
└──────────────────────────────────────────────────────────────────────────────┘

In the first 4.5 seconds, no two moments are identical:

0.0s: B=0°,    S=-100%, Br=0.3  (unique combination 1)
0.5s: B=72°,   S=-75%,   Br=0.4 (unique combination 2)
1.0s: B=144°,  S=-50%,   Br=0.5 (unique combination 3)
1.5s: B=216°,  S=-25%,   Br=0.6 (unique combination 4)
2.0s: B=288°,  S=0%,     Br=0.7 (unique combination 5)
2.5s: B=0°,    S=25%,    Br=0.6 (unique combination 6) ← Border resets
3.0s: B=108°,  S=50%,    Br=0.5 (unique combination 7)
3.5s: B=180°,  S=75%,    Br=0.4 (unique combination 8)
4.0s: B=252°,  S=-100%,  Br=0.3 (unique combination 9) ← Shimmer resets
4.5s: B=0°,    S=-50%,   Br=0.3 (unique combination 10) ← Breathing resets

After 4.5s, the pattern repeats with fresh starting conditions.
User's eye interprets this as "continuous novelty" rather than "repetitive pattern."
```

---

## 7. Z-Index Stacking Context

```
Visual layer diagram (higher z-index = on top):

┌─────────────────────────────────────────┐
│ z-index: 3                              │
│ ┌───────────────────────────────────┐   │
│ │ Span Text: "Click Me"             │   │ ← Readable text on top
│ │ (from HTML: <span>Click Me</span>)│   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
         ▲ (behind text, but above effects)
         │
┌─────────────────────────────────────────┐
│ z-index: -1 (relative to span)          │
│ ┌───────────────────────────────────┐   │
│ │ span::before: Breathing Glow      │   │ ← Glow behind text
│ │ Pulses blue, 4.5s cycle           │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
         ▲ (above shimmer effects)
         │
┌─────────────────────────────────────────┐
│ z-index: 2                              │
│ ┌───────────────────────────────────┐   │
│ │ ::before: Particle Shimmer        │   │ ← Tiny sparkles
│ │ (multiple pseudo-layers)          │   │
│ │ ::after: Directional Shimmer      │   │ ← Diagonal beam
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
         ▲ (above button surface)
         │
┌─────────────────────────────────────────┐
│ z-index: 1 (default)                    │
│ ┌───────────────────────────────────┐   │
│ │ Button Interior (black padding-box)   │ ← Solid background
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
         ▲ (above border gradient)
         │
┌─────────────────────────────────────────┐
│ z-index: 0 (implicit)                   │
│ ┌───────────────────────────────────┐   │
│ │ Animated Border (conic-gradient)  │   │ ← Rotating light
│ │ on border-box layer               │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 8. The Complete System: Data Flow

```
CSS VARIABLE FLOW:

@property declarations:
├── --gradient-angle (animated 0° → 360°)
├── --position (particle position, default 50%)
├── --gradient-angle-offset (control offset)
└── --gradient-shine (color control)

                    ↓

.shiny-cta animation (2.5s):
├── Uses: --gradient-angle
├── Powers: conic-gradient in background (border light rotation)
└── Powers: conic mask in ::before (particle visibility rotation)

                    ↓

Three effects powered by the animation:
├── Border light: rotates with --gradient-angle
├── Particle shimmer: mask rotates with (--gradient-angle + 45deg)
└── Span glow: independent 4.5s breathing cycle

                    ↓

Four visual outputs:
├── 2.5s: Border light rotates (primary visual)
├── 2.5s: Particle synchronized with border (detail layer)
├── 4.0s: Diagonal shimmer (depth layer)
└── 4.5s: Breathing glow (energy layer)

                    ↓

LCM = 10.0s: All animations re-synchronize, pattern repeats
```

This is the complete mechanical system that creates the shiny button effect through sophisticated CSS layering and animation timing.
