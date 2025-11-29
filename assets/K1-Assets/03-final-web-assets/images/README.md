# K1 Hero SVG (Potrace)

Generated vector for the hero mark (`K1`) to feed into the Paper `liquid-metal` shader.

- Final asset (canonical from design): `K1-Assets/03-final-web-assets/images/k1-hero.svg`
- Geometry source: copied verbatim from `K1.LandingPage.Aura/K1_LandingPage.html` hero SVG (viewBox `0 0 743.2 576`).
- Font files kept here only for legacy font-based experiments: `K1-Assets/03-final-web-assets/fonts/Manrope-VariableFont_wght.ttf` (OFL license in the same folder)

## Regenerate

```bash
# To re-export the exact shape from the canonical path (no font dependency):
cat > K1-Assets/03-final-web-assets/images/k1-hero.svg <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 743.2 576" aria-labelledby="title desc" role="img">
  <title id="title">K1 Logo</title>
  <desc id="desc">Official K1 outline exported from K1_LandingPage.html</desc>
  <path
    d="M 108.8 576 L 0 576 L 0 0 L 108.8 0 L 108.8 265.6 L 328 0 L 460.8 0 L 220 284 L 476 576 L 338.4 576 L 108.8 313.6 L 108.8 576 Z M 743.2 576 L 632 576 L 632 118.4 L 524 184.8 L 524 64.8 L 632 0 L 743.2 0 L 743.2 576 Z"
    fill="black"
    stroke="none"
    fill-rule="evenodd"
  />
</svg>
EOF
```

Tweaks:
- Outline stroke instead of fill (e.g., to match animated trace): set `fill="none" stroke="black" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"` on the `<path>`.

## Using with the shader

Drop `K1-Assets/03-final-web-assets/images/k1-hero.svg` into https://shaders.paper.design/liquid-metal (or the `paper-design/liquid-logo` starter) as the source logo. It is a clean black silhouette on transparent background, ready for metal shading/displacement.
