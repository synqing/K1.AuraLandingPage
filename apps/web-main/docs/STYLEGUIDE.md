# Styleguide · K1 Aura Landing Page

## Typography

- **Headings** use the Manrope family (`font-manrope` through Tailwind). Uppercase and tight tracking for hero text. Equivalent CSS fallback: `font-family: 'Manrope', system-ui, sans-serif`.
- **Body** copy uses Space Grotesk (`font-space`).
- **Accent** elements (pricing, nav chips) use Inter (`font-inter`).

## Colors

Primary palette lives inline via Tailwind classes:

- Backgrounds: `bg-black`, `bg-zinc-900`, gradients with accent overlays.
- Accent Gold: `#FFB84D` (`text-[#FFB84D]`).
- Copy: `#F2F2F2` with `text-zinc-400/500/600` for secondary content.

## Layout

- Sections stack vertically with `snap-start` for a snap-scrolling experience.
- Gradients and radial overlays use Tailwind arbitrary values (e.g., `bg-[radial-gradient(...)]`).
- Hero iframe locked at `aspect-[16/9]` and rounded corners `rounded-[1.75rem]`.
- Module cards alternate alignment using the `align` property in `MODULES[]`.
- CTA section uses blurred background + border for a glassmorphism effect.

## Components

- **Hero**: Title, iframe, status bar overlay.
- **Module cards**: Data-driven, easy to extend by pushing to `MODULES` array.
- **CTA form**: Form with server action fallback (`submitAccessRequest`). Ideally pair with real email automation.
- **Payment API**: Not directly exposed in UI yet; use `/app/api/payments` POST endpoint when hooking up forms.

Feel free to extract repeated UI into `components/` if the page grows. This styleguide exists to keep future contributors aligned on fonts, colors, and layout choices.
