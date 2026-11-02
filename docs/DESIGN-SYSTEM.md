# Design System

Para's look in one place: colors, type, shapes, motion, and the shared components.
Everything is plain CSS. The tokens live at the top of `style/global.css`, and every page uses them,
so changing a token changes the whole site (including dark mode and the admin panel).

**Idea:** black and white do the work; green is only a small accent.

## Colors

### Core tokens

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--primary` | `#1D1F1E` | `#F5F5F5` | Primary buttons, selected chips and tabs |
| `--primary-hover` | `#000000` | `#FFFFFF` | Primary button hover |
| `--on-primary` | `#FFFFFF` | `#1D1F1E` | Text and icons on `--primary` |
| `--accent` / `--green` | `#2ECC71` | `#2ECC71` | Active-page dot, focus rings, map route, chart bars, success toast |
| `--bg` | `#FFFFFF` | `#1E1E1E` | Page background |
| `--bg-card` | `#FFFFFF` | `#282828` | Cards, panels, modals |
| `--bg-soft` | `#F6F7F6` | `#242424` | Quiet surfaces: section bands, table hover |
| `--bg-input` | `#F4F5F4` | `#323232` | Form fields, skeleton blocks |
| `--text` / `--text-main` | `#1D1F1E` | `#E8E8E8` / `#FFFFFF` | Body text / headings |
| `--text-muted` | `#6B6F6D` | `#A0A0A0` | Secondary text, labels |
| `--border` | `#E8EAE9` | `#3A3A3A` | Card and field borders, dividers |
| `--navbar-bg` | `rgba(255,255,255,.72)` | `rgba(30,30,30,.72)` | Frosted-glass navbar |

### Status colors

| Token | Value | Used for |
| --- | --- | --- |
| `--red` | `#E5484D` | Errors, delete actions |
| `--orange` | `#E67E22` | Warnings (walk / tricycle notes) |
| `--yellow` | `#F1C40F` | Heat map middle step |
| `--blue` | `#3498DB` | Info |
| Success text | `#1F9D55` | Focused floating label, success toast icon |

### Sky

The login panel, About Us closing section, and video outro use the `.sky` background with three drifting cloud layers.

| | Gradient (top → bottom) |
| --- | --- |
| Light | `#6FBDF2` → `#A9DBFA` → `#E6F5FF` |
| Dark | `#0C1D30` → `#183754` → `#27506F` |

### Map

| Layer | Color |
| --- | --- |
| Base map | OpenFreeMap `positron` (light) / `dark` (dark) |
| SJDM outline | `#1D1F1E`, 1.5 px (white in dark mode) |
| Chosen road route | `#27AE60`, 5 px, over a `#2ECC71` glow (16 px, blurred, 28% opacity) |
| Other route options | `#9AA19D` (`#8A8F8C` in dark mode), 5 px, 70% opacity |
| Straight line while the route loads | `#2ECC71`, 3 px, dashed |
| Admin heat map | transparent → `#2ECC71` → `#F1C40F` → `#E67E22` → `#E5484D` |

**Rule:** do not color headings or whole buttons green. Green marks *state* (active, focused, success, the route), not decoration.

## Typography

| | |
| --- | --- |
| Font stack | `ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, -apple-system, 'Segoe UI', sans-serif` |
| Why | SF Pro Rounded is Apple-only and cannot be hosted on the web, so Apple devices get it from the system and everyone else gets Nunito (Google Fonts, weights 400–800). |
| Headings (`h1`–`h2`) | Weight 800, letter-spacing `-0.03em` |
| Smaller headings (`h3`, `h4`) | Weight 750 |
| Body | Weight 400, line-height 1.5 |
| Buttons, labels | Weight 600 |
| Eyebrow (small label over a heading) | 0.78 rem, weight 600, uppercase, letter-spacing `0.06em` |
| Section titles | `clamp(1.5rem, 3vw, 2rem)` so they shrink on phones |

**Text case:** headings and buttons use Title Case ("How Para Works", "Start Your Commute"). Sentences and helper text use sentence case. Category names (School, Hospital…) are capitalized in the data, not by CSS.

## Shape, Depth, Motion

| Token | Value | Used for |
| --- | --- | --- |
| `--radius` | `20px` | Cards, panels, modals |
| `--radius-sm` | `12px` | Inputs, small cards |
| Pill | `999px` | Buttons, chips, toggles, tags |
| `--shadow` | `0 1px 2px rgba(16,24,20,.04), 0 6px 20px rgba(16,24,20,.05)` | Resting cards |
| `--shadow-lg` | `0 12px 40px rgba(16,24,20,.12)` | Floating panels, modals, menus |
| `--transition` | `0.25s ease` | Hover and color changes |

Motion:

- **Page enter:** 320 ms opacity fade on `main` and the footer (`page-enter`); the navbar stays still.
- **Main easing:** `cubic-bezier(.22, 1, .36, 1)` (fast start, soft stop) for most movement.
- **Scroll reveal:** `.anim-on-scroll` fades and lifts sections in as they enter the screen (`.anim-delay-1…` to stagger).
- **Reduced motion:** with `prefers-reduced-motion: reduce`, animations are turned off or reduced to fades.

## Layout

- Content width: up to about `1100px`, centered.
- Breakpoints: `900px` (main one: two columns become one, the navbar links move to the phone menu), then `600px` and `480px` for small phones.
- The calculate page is a full-screen map with a floating panel (a bottom sheet on phones).
- The admin panel has a left sidebar that collapses to icons; the content stays centered.

## Components

| Component | Class / file | Notes |
| --- | --- | --- |
| Primary button | `.btn-primary-lg` (`global.css`) | Black pill with white text (white with black text in dark mode), `14px 26px` padding |
| Ghost button | `.btn-ghost-lg` | Card-colored pill with a border, for the second action ("Watch Demo") |
| Outline flood button | `.btn-outline-flood` | Fills with color from the left on hover ("Start Your Commute" in the hero) |
| Navbar | `.navbar` | Frosted glass (`--navbar-bg` + blur); the active page has a small green dot. Signed-in passengers see a `|` divider (`.nav-divider`), then the date and "Good Morning / Afternoon / Evening, Name!" (`.nav-greeting`) before the profile picture; hidden under 600px |
| Language / theme toggles | `.lang-toggle`, `#dark-toggle` | EN / FIL pill and a sun / moon switch, top right on every passenger page |
| Segmented control | `.seg`, `.seg-btn`, `.seg-glider` | A highlight slides between the options (settings tabs, Trip / Saved) |
| Chips | `.chip`, `.chip.is-selected` (`calculate.css`) | Vehicle and passenger choices |
| Floating-label field | `.float-field` (`auth.css`) | The label sits inside the field and moves up (scale 0.74) when focused or filled; turns green on focus. CSS only. |
| Toast | `.toast` (`global.css`) | Bottom-right card with a round status icon, bold title, message, close button, and a 4 s timer line that pauses on hover |
| Modal | `.modal-overlay.open` (`calculate.css`) | Grows from the button that opened it and shrinks back into it |
| Skeleton | `.skeleton` | Grey shimmering blocks in the exact shape of the content that is loading |
| Footer | `.footer` | Logo, contact details, Facebook and Instagram buttons, Help & FAQs link |

## Icons and Images

- **Icons:** Lucide (`<i data-lucide="name">`), turned into SVG by `ui.js`. Brand icons (Facebook, Instagram) are inline SVG.
- **Logo:** `assets/logo-wordmark.png`. **Favicon:** `assets/img/favicon.png`.
- **Para the mascot:** WebP images in `assets/img/` (`para-hello`, `para-fly`, `para-phone`, `para-hint`, `para-head`).
- **Video:** `assets/video/para-showcase.mp4` (720p) with the poster `para-showcase-poster.webp`.

## Dark Mode

- Turned on by the `dark` class on `<html>`, set by `early-theme.js` before the page is drawn (no white flash).
- The choice is saved in `localStorage` and applies to every page, including the admin panel and the maps.
- Dark mode only swaps token values; components should use tokens, never fixed light colors.
