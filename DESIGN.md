---
name: MundaneApps
description: Calm studio identity shared by tools and games
colors:
  org-accent: "#35617a"
  org-accent-hover: "#284e65"
  org-accent-dark: "#abcdef"
  org-accent-hover-dark: "#c4def6"
  org-contrast: "#ffffff"
  org-contrast-dark: "#0b1720"
  headsup-accent: "#007272"
  headsup-accent-dark: "#69cee0"
  bg: "#f6f5f2"
  bg-dark: "#000000"
  surface: "#fffffe"
  surface-dark: "#171a1f"
  surface-2: "#f0f0ed"
  surface-2-dark: "#22262c"
  fg: "#1e2430"
  fg-dark: "#eef2f6"
  fg-soft: "#566172"
  fg-soft-dark: "#b9c1cb"
  muted: "#596476"
  muted-dark: "#a4aeba"
  border: "#dce1ea"
  border-dark: "#343a43"
  border-strong: "#c8d0dd"
  border-strong-dark: "#4a5260"
typography:
  display:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: "clamp(3rem, 7.2vw, 5.8rem)"
    fontWeight: 700
    lineHeight: 1.13
    letterSpacing: "-0.03em"
  headline:
    fontSize: "clamp(1.8rem, 4vw, 2.7rem)"
    fontWeight: 600
    lineHeight: 1.13
    letterSpacing: "-0.03em"
  body:
    fontSize: "16px"
    lineHeight: 1.5
  label:
    fontSize: "0.875rem"
    fontWeight: 600
rounded:
  sm: "8px"
  lg: "16px"
  xl: "18px"
  pill: "999px"
spacing:
  gutter: "clamp(20px, 4.5vw, 72px)"
  section: "clamp(64px, 9vw, 108px)"
components:
  button-primary:
    backgroundColor: "{colors.org-accent}"
    textColor: "{colors.org-contrast}"
    rounded: "{rounded.pill}"
    padding: "13px 24px"
  button-primary-dark:
    backgroundColor: "{colors.org-accent-dark}"
    textColor: "{colors.org-contrast-dark}"
    rounded: "{rounded.pill}"
    padding: "13px 24px"
---
# Design System: MundaneApps

## Overview

**Creative North Star: "The Calm Studio"**

The incumbent system is a calm, neutral studio: warm pale surfaces in light mode, an absolute-black canvas and charcoal materials in dark mode. System typography, generous space, restrained blue accents, and softly rounded controls keep the site familiar across products and games. This records the implemented site, not an approved redesign comp.

**Key Characteristics:**
- Quiet neutral surfaces and one accent per brand and theme.
- Generous spacing, clear hierarchy, and familiar system type.
- Actual product imagery within a consistent studio shell.

## Colors

### Primary
The studio uses muted slate blue in light mode and pale sky blue in dark mode. Primary actions and links use the active brand accent; hover uses its paired token. HeadsUp retains its teal product accent. Games currently inherit the studio accent.

### Neutral
Light mode uses warm off-white backgrounds with near-white surfaces and dark ink. Dark mode uses an absolute-black page, charcoal surfaces, and pale text. Soft text, muted labels, and stronger input borders have paired theme values in the frontmatter. CSS custom properties in `style.css` remain the implementation authority; frontmatter names ending in `-dark` document their dark overrides.

## Typography

Use the local system sans-serif stack throughout. No external font request is required. Headings have tight tracking and compact line height; body text stays open and readable. Display describes the home hero; its small-screen override is `clamp(2.65rem, 13vw, 4rem)`. Standard hero titles use `clamp(2.5rem, 6.4vw, 4.6rem)`. Game titles use `clamp(2.6rem, 6vw, 4.8rem)`, while game feature headings use `clamp(2rem, 4.5vw, 3.6rem)`. Eyebrows are sentence case; compact status badges use uppercase.

## Layout

The centered shell is capped at 1320px with fluid horizontal gutters. Sections use the spacing tokens above; standard section headings measure up to 68ch. Shared navigation collapses at 820px. Existing home/product motion layouts also adapt at 900px and 640px.

Games use a text-led two-column feature with a 240–360px visual column, a fluid 32–96px gap, and copy up to 62ch. At 700px and below this becomes one column. The portrait capture remains at its natural aspect ratio, capped at 320px on larger screens and 260px on small screens. Reading sections use a 76ch content measure plus gutters. Information links wrap, then stack on small screens.

## Elevation & Depth

Depth combines subtle shadows, translucent glass, and material gradients. Small, medium, and large shadows distinguish controls, panels, and floating menus. The scrolled header gains a blurred translucent surface and hairline; dark surfaces use charcoal gradients. Background organic lines and home/product scroll reveals are incumbent details, not a requirement to add animation to every new route. Honor reduced-motion preferences; hover lifts and motion scenes have reduced-motion fallbacks.

## Shapes

Controls use pill forms; fields and small panels use the small radius. Cards and game captures use the large radius, with larger feature frames using the extra-large radius. App icons keep their own softly rounded square form. Borders are quiet separators rather than heavy frames.

## Components

- **Primary action:** filled brand accent, contrasting label, pill shape, small shadow; hover shifts upward by 2px and uses the hover accent. Focus remains visible.
- **Glass action:** translucent surface, quiet border, foreground label; hover strengthens the surface and applies the same restrained lift.
- **Navigation:** sticky shared studio header, rounded text links, click-open Products menu, and compact mobile control. Games remains a peer navigation link.
- **Status badge:** compact uppercase accent tint with a fine accent border and optional dot.
- **Input:** surface background, stronger neutral border, small radius, and accent focus ring. Dark mode uses the incumbent charcoal material.
- **Panel:** gently rounded material gradient, subtle border, and medium shadow.
- **Game preview:** authentic portrait capture with a muted centered caption. Game details and availability copy remain readable text alongside the primary action.

## Do's and Don'ts

### Do:
- Do preserve the shared studio header, footer, system typography, and both themes.
- Do show actual game captures at their natural aspect ratio with a clear caption.
- Do use the existing accent variables and visible keyboard focus treatments.

### Don't:
- Don't replace the studio identity with the game’s in-game visual language.
- Don't crop a portrait game capture into an invented promotional composition.
- Don't imply public availability through a download button while closed testing is pending.
