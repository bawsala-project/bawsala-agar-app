# BAWSALA DESIGN RULES
Product: Bawsala (بوصلة), an Arabic RTL real-estate decision app for Saudi users. UI-only prototype: hardcoded data in /lib/seed.ts, images in /lib/images.ts, copy in /lib/copy.ts, fake loading, no backend. Presented at http://localhost:3000 inside a phone mockup shell. The app lives under its own routes (/welcome, /start, /case/demo/..., /dashboard).

## Look
Look: dark, calm, premium, warm. Mostly dark: about 85% espresso/cocoa surfaces and photography, 12% sandstone (text, selected fills, primary CTA), 3% semantic copper. No light surfaces anywhere.

## Tokens (only these; no hard-coded colors, sizes or radii inside components)
Brand colors: --espresso #130F08 (base background), --cocoa #3D271A (warm lit accent: banners, hero glows, selected-card tint, max one cocoa-lit area per screen), --driftwood #645A4E (decorative only: strokes, inactive icons, map lines, tick marks; NEVER text, about 2.8:1), --sandstone #D7CBBE (body text, selected fills, primary CTA).
Derived (tints and shades of the four only): --ink #EFE7DC (headlines, lightened sandstone), --muted #A89C8D (secondary text, about 7:1 on espresso), --surface-1 #1B140D, --surface-2 #251A11 (cards), --surface-3 = cocoa (icon circles, chips), --stroke rgba(215,203,190,0.12).
Backgrounds: espresso with a soft radial lift of cocoa at 35% near the top. Allowed gradients: espresso to cocoa (vertical) and the radial lift. Scrims always use rgba(19,15,8,x).
Glass: rgba(100,90,78,0.34) (driftwood), blur 24px, saturate 120%, 1px border rgba(215,203,190,0.22), inner top highlight, shadow 0 12px 32px rgba(19,15,8,0.5). glass-dark: rgba(19,15,8,0.5). Max 3 glass layers per screen, solid-fill fallback without backdrop-filter.
Semantic: --copper #C2643A, only for "conflicting" (tiny dot or hairline). Certainty dots: confirmed = sandstone filled, unknown = hollow ring in --muted, conflicting = copper.
Focus ring: 2px sandstone. Selected chip: sandstone fill with espresso text. Primary CTA: sandstone pill with espresso label and an espresso arrow chip with sandstone arrow.
Photo grade: saturate(0.9) contrast(1.05) sepia(0.06) with espresso scrims.
Forbidden: pure #000 and #FFF, any grey, blue, green or neon, and any color not listed here.
Font: IBM Plex Sans Arabic only (300, 400, 500, 600). No mono, no italics, no letter-spacing on Arabic. The logo asset is the only serif.
Scale: page padding 20; card radius 28; photo card radius 32; circle button 44; chip height 40; pill height 48 and 56; gaps 12 and 24. Headline 40-48 / 300 / 1.15; section title 18 / 600; body 15; caption 13; stat number 40 / 500 with unit 14 muted.
Motion: 150 / 300 / 500ms, spring or cubic-bezier(0.22,1,0.36,1); fade + 12px rise; stagger 60ms; press scale 0.97; transform and opacity only; honor prefers-reduced-motion.

## Components (the ONLY allowed ones, in /components/ui, one per file)
CircleButton (glass 44px, icon only). GlassPill (48 or 56px, label + optional icon/arrow; primary pills use the 40px espresso circular arrow chip with sandstone arrow nudging 4px on press). StatCard (surface-2, radius 28, about 170x150: small label top-start, circular icon button top-end, big number + small unit at the bottom). WideCard (full width, value or toggle at the end). PhotoCard (radius 32, full-bleed photo with espresso scrim, glass chip top-start with icon circle + title, glass bottom bar with a pill and 1-3 circle buttons; photo grade saturate(0.9) contrast(1.05) sepia(0.06)). ChipsRow (active = sandstone fill with espresso text; inactive = surface-2 + stroke). ActionBar ([CircleButton] [wide GlassPill with label and arrow] [CircleButton], pinned bottom, 20px from edges, above safe area; circle buttons only when they have a real function). FloatingNav (glass capsule, 4 icons, sliding lens highlight; dashboard-level screens only). Banner (espresso-to-cocoa gradient with subtle topographic contour lines in sandstone at 8% and a circular arrow button). Headline (optional inline image capsule between words; balanced wrapping with text-wrap: balance, capsules only with a distinct photo never matching background, 72x36 pill on start side of following word). GlassSheet (bottom sheet, snaps 38/62/92%). MapView (land espresso, blocks surface-2, roads driftwood at 60%, parks driftwood at 25%, pins sandstone, travel ring dashed sandstone). CompassDial (curved wheel picker: intentional exception to RTL mirroring with hub and 72-tick rotating ring on the LEFT screen edge half cropped, fixed diamond needle pointing right with +/-4° spring wobble on every snap, labels fanning out to the RIGHT anchored by near-ring edge with Arabic text RTL inside, angle 0 selected perfectly horizontal on exact same y as needle at 52px/600/sandstone, neighbors at 28px/500/sandstone with opacities 0.8, 0.55, 0.3 going outward and 0-1.5px blur on farthest, label radius 176px, angular step 17°, min 44px neighbor spacing, infinite looping wrap-around dial with 7 visible items, opposite-edge slim vertical scrub bar on RIGHT edge with draggable 22x44 pill handle mapping to item index without overlapping labels, inertia drag, wheel, keyboard, no per-frame re-render, reduced-motion support).

## Rules
- Each screen: max 1 title, 2 sections, 1 primary action, 3 chips per card. Extra detail goes in a GlassSheet.
- RTL with logical properties only (ms/me, ps/pe, start/end). Arrows and chevrons follow RTL.
- Numbers with units are wrapped in <bdi dir="ltr">.
- Safe areas: use --safe-top and --safe-bottom for headers and bottom bars.
- ActionBar circles only when they have a real function; primary pills use the circular arrow chip; headlines use balanced wrapping and capsules only with a distinct photo.
- Never: new card types, paper/light surfaces, brackets, grid backgrounds, mono fonts, gradients outside the tokens, inline styles with raw values, emoji, star ratings, numeric scores or verdicts.
- Structure: /components/ui (atoms), /components/shell (presentation shell), /features/<screen> (screen-specific parts), /lib (seed, images, copy, motion, format), /app (routes). Named exports, no `any`, no dead code.

## Routes
/ (presentation shell), /welcome, /start, /case/demo/needs, /case/demo/properties, /case/demo/preflight, /case/demo/checkout, /case/demo/analyzing, /case/demo/results, /case/demo/property/[id], /case/demo/compare, /case/demo/inspection, /case/demo/reassess, /dashboard, /styleguide.

## QUALITY GATE (run before replying to any task)
1. Run `npx tsc --noEmit`, `npm run lint` and `npm run build`; fix every error and every warning you introduced.
2. Open the screen inside the shell at http://localhost:3000 at 393x852; confirm: no console errors, warnings or hydration messages; no horizontal scroll; no cut-off or overlapping elements; images load; fonts correct; RTL correct.
3. Check against these rules: only the allowed components, tokens only, one title, at most two sections, one primary action.
4. Remove dead code and unused files you created.
5. Reply in at most 6 lines: files changed, what you verified, known issues. Do not start the next task.
