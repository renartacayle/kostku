# KostKu — Semantic Design System & Visual Specification (`DESIGN.md`)

> **Engine:** Taste Skill v2 & Google Stitch Semantic Architecture  
> **Target:** KostKu Smart PropTech Ecosystem (Web PWA, Android Capacitor, Windows Desktop)  
> **Status:** Production Design Reference  
> **Version:** 1.0.4 Enterprise Architecture  

---

## 1. Visual Atmosphere & Design Read

> **Design Read:**  
> *"Reading KostKu as: Dual-sided Architectural PropTech platform for discerning student renters and professional kost owners, with an Architectural Warm-Modernist + Precision CAD visual language, leaning toward Bespoke Bento Grid and Tactile Glassmorphism with restrained kinetic motion."*

### The Three Dials Calibration
* **`DESIGN_VARIANCE` : `8 / 10` (Offset Asymmetry)**  
  Rejects predictable symmetrical grids. Employs mixed column/row spans, offset visual anchors, and editorial typography contrasting against technical CAD schematics.
* **`MOTION_INTENSITY` : `6 / 10` (Fluid Spring Physics)**  
  Restrained physics-driven transitions (`stiffness: 100, damping: 20`). No disorienting rotations or floating distractions. Motion exists purely to communicate spatial relationships (zooming into blueprints, door swing arcs, sliding pricing dials).
* **`VISUAL_DENSITY` : `5 / 10` (Balanced Architectural Hierarchy)**  
  Airy and cinematic on marketing headers, transitioning into high-precision, dense data cockpits for CAD dimensions, kWh utility counters, and room availability matrices.

---

## 2. Color Calibration & Palette Architecture

### Banned Palettes (Anti-Slop Directives)
* ❌ **STRICTLY BANNED:** Generic AI Purple/Neon Gradients (`#8b5cf6`, `#a855f7`, `#ec4899` blends).
* ❌ **STRICTLY BANNED:** Pure Black backgrounds (`#000000`).
* ❌ **STRICTLY BANNED:** Oversaturated neon button glows and generic dark mesh filters.

### Approved Color System

| Semantic Role | Token Name | Hex Code | Visual Character & Usage |
| :--- | :--- | :--- | :--- |
| **Foundation Void** | `bg-void` | `#080d1a` | Deep Blue-Hour Twilight. Replaces pure black with atmospheric depth. |
| **Surface Primary** | `bg-surface-1` | `#0e1726` | Dark Slate-Navy. Ground plane for elevated cards and navigation bars. |
| **Surface Secondary** | `bg-surface-2` | `#152238` | Highlighted cards, blueprint containers, and floating modals. |
| **Border Subtle** | `border-subtle` | `rgba(255, 255, 255, 0.07)` | Hairline container dividers. |
| **Border Active** | `border-active` | `rgba(59, 130, 246, 0.35)` | Interactive hover borders and focused input outlines. |
| **Primary Accent** | `accent-electric`| `#2563eb` | Singular high-contrast action color (75% saturation). Used for primary CTAs and CAD line highlights. |
| **Accent Glow** | `accent-blue-soft`| `#60a5fa` | Secondary link text, active tab indicators, and icon accents. |
| **Tactical Wood** | `accent-teak` | `#d97706` | Warm Indonesian Teak wood tone for architectural furniture tags and room accents. |
| **Status Verified** | `accent-emerald`| `#059669` | Trust seals, e-KTP anti-bot verification badges, and payment successes. |
| **Status Urgent** | `accent-crimson`| `#dc2626` | Critical billing alerts, smart-lock PIN errors, and SLA urgent tickets. |
| **Text Primary** | `text-primary` | `#f8fafc` | 98% white with subtle cool tint for maximum legibility without eye-strain. |
| **Text Muted** | `text-muted` | `#94a3b8` | Supporting body copy and metadata. |
| **Text Dim** | `text-dim` | `#64748b` | Sub-labels, CAD measurement units, and footer copyright. |

---

## 3. Typographic Architecture

### Font Stack Strategy
* **Primary Sans:** `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`  
  *Justification:* Modern geometric neo-grotesque with warm, human open counters. Avoids the uninspired AI default of vanilla `Inter`.
* **Technical & Metrics Monospace:** `'JetBrains Mono', 'Fira Code', monospace`  
  *Mandatory Rule:* All room dimensions (`3.5 × 4.2 m`), utility meter readings (`142.8 kWh`), currency prices (`Rp 1.450.000`), and timestamps MUST use monospace or `font-variant-numeric: tabular-nums`.

### Scale & Hierarchy
* **Display Headline (Hero):** `clamp(2.4rem, 6vw, 4.2rem)`, `font-weight: 800`, `letter-spacing: -0.035em`, `line-height: 1.08`.
* **Section Heading:** `clamp(1.75rem, 3.5vw, 2.5rem)`, `font-weight: 700`, `letter-spacing: -0.025em`, `line-height: 1.2`.
* **Sub-Heading & Card Titles:** `1.15rem – 1.35rem`, `font-weight: 600`, `letter-spacing: -0.015em`.
* **Body Copy:** `0.925rem – 1rem`, `font-weight: 400`, `line-height: 1.65`, maximum line length 65 characters (`max-w-prose`).
* **Micro-Labels & Badges:** `0.72rem – 0.8rem`, `font-weight: 700`, `letter-spacing: 0.08em`, `text-transform: uppercase`.

---

## 4. Layout & Bento Grid Philosophy

### Anti-Generic Structure
* ❌ **Never** stack 3 identical horizontal cards side-by-side.
* ✅ **Bento Grid Layout:** Use CSS Grid with dynamic span ratios:
  * **Focal Anchor Card (Span 2 col):** Houses the interactive 2D Blueprint with dynamic dimension overlays.
  * **Secondary Data Card (Span 1 col):** Houses the 3D Sun Orientation & Cross-Ventilation dial.
  * **Tactile Metric Card (Span 1 col):** Houses the Live kWh Utility Calculator with real-time tariff sliders.
  * **Trust Card (Span 2 col or Full):** Anti-bot e-KTP single-identity badge with verified owner signature.
* ✅ **Viewport Stability:** Full-screen hero sections MUST use `min-height: 100dvh` (never `100vh`) to prevent mobile Safari / Android WebView jump glitches.
* ✅ **Container Constraints:** Main page wrapper constrained to `max-w-7xl` (`1280px`) with fluid horizontal padding `clamp(1rem, 4vw, 2.5rem)`.

---

## 5. Component Behavior & Interaction States

### Buttons & Interactive Controls
* **Tactile Feedback:** Every button must simulate mechanical click physics:
  ```css
  transition: transform 0.15s cubic-bezier(0.2, 0, 0, 1), background-color 0.2s ease, box-shadow 0.2s ease;
  &:active {
    transform: scale(0.98) translateY(1px);
  }
  ```
* **No Glow Artifacts:** Buttons use solid or subtly tinted borders (`border border-blue-500/30`), never oversaturated neon blurred drop-shadows.

### Cards & Spatial Elevation
* Cards utilize dual border styling:
  * `border: 1px solid rgba(255, 255, 255, 0.06)`
  * `box-shadow: 0 10px 30px -10px rgba(2, 6, 23, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
* Hover state creates a gentle specular refraction:
  * Border shifts to `rgba(96, 165, 250, 0.25)`
  * Elevates `translateY(-4px)` without jitter.

### Form Inputs & Search
* Dark recessed field (`background: rgba(255, 255, 255, 0.03)`).
* Visible accessibility focus ring with high contrast (`outline: 2px solid #2563eb`).
* Clear buttons (`X`) must have a minimum tap target of `44px` on mobile.

---

## 6. Motion Philosophy & Spring Physics

* **Physics Baseline:** Motion animations leverage Apple-grade damped springs (`stiffness: 100, damping: 20`).
* **GPU Acceleration:** Animations are strictly limited to `transform` and `opacity`. Mutating `top`, `left`, `width`, or `height` is strictly prohibited.
* **Perpetual Micro-Interactions:**
  * Status beacons pulse softly (`opacity: 0.6` to `1` over 2s).
  * Hovering blueprint elements triggers clean crosshair coordinate tooltips.

---

## 7. Master Anti-Pattern Checklist (AI Tells Ban)

1. [x] **No Inter + Slate-900:** Swapped for Plus Jakarta Sans on Blue-Hour Twilight.
2. [x] **No Purple Gradients:** Swapped for Electric Blue + Teak Architectural Amber.
3. [x] **No 3 Equal Cards:** Swapped for Asymmetric 4-Tile Bento Architecture.
4. [x] **No Truncated Code (`...`):** Complete, production-ready modules only.
5. [x] **No Fake Copywriting:** No *"Unleash the next-gen seamless experience"*. Replaced with authentic Indonesian proptech reality: *"Denah Vektor 2D Skala 1:50, Bebas Manipulasi Lensa Kamera"*.
6. [x] **No Proportional Numbers:** Tabular figures & JetBrains Mono for all utility and price figures.
