---
name: Dent Repair Pro
description: Painted panel, straight reflection, clear next action.
colors:
  panel: '#15309a'
  panel-high: '#1a3bb4'
  panel-deep: '#0b1b5e'
  line: '#f2f5ff'
  line-soft: '#b7c6f2'
  line-nav: '#d5defa'
  amber: '#ffb454'
  board: '#f4f6fb'
  board-high: '#ffffff'
  ink: '#0b1340'
  ink-soft: '#3c4a86'
  ink-hair: rgba(11, 19, 64, 0.18)
  ink-rule: rgba(11, 19, 64, 0.82)
  line-hair: rgba(242, 245, 255, 0.26)
  placeholder: '#5b6794'
  field-border: '#8d9bcb'
typography:
  display:
    fontFamily: '"Big Shoulders Display", "Arial Narrow", "Helvetica Neue", sans-serif'
    fontSize: clamp(3.75rem, 9.4vw, 8rem)
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: -0.012em
  headline:
    fontFamily: '"Big Shoulders Display", "Arial Narrow", "Helvetica Neue", sans-serif'
    fontSize: clamp(2.75rem, 5.4vw, 4.75rem)
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: -0.01em
  title:
    fontFamily: '"Big Shoulders Display", "Arial Narrow", "Helvetica Neue", sans-serif'
    fontSize: 2rem
    fontWeight: 800
    lineHeight: 1
  category:
    fontFamily: '"Big Shoulders Display", "Arial Narrow", "Helvetica Neue", sans-serif'
    fontSize: 1.7rem
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.005em
  body:
    fontFamily: '"Archivo", "Helvetica Neue", Arial, sans-serif'
    fontSize: 1.0625rem
    fontWeight: 400
    lineHeight: 1.55
  intro:
    fontFamily: '"Archivo", "Helvetica Neue", Arial, sans-serif'
    fontSize: clamp(1.1rem, 1.35vw, 1.25rem)
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: '"Archivo", "Helvetica Neue", Arial, sans-serif'
    fontSize: 0.98rem
    fontWeight: 600
    lineHeight: 1.55
  closing:
    fontFamily: '"Big Shoulders Display", "Arial Narrow", "Helvetica Neue", sans-serif'
    fontSize: clamp(3.4rem, 10.5vw, 8rem)
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: -0.015em
rounded:
  plate: 2px
spacing:
  gutter: clamp(1.25rem, 4vw, 3.5rem)
  actions-gap: 0.75rem
  choice-gap: 0.5rem
  section-block: clamp(4.5rem, 9vw, 8rem)
  content-start: clamp(2.5rem, 5vw, 4rem)
  worksheet-gap: 1.6rem
components:
  plate-light:
    backgroundColor: '{colors.line}'
    textColor: '{colors.ink}'
    rounded: '{rounded.plate}'
    padding: 0 1.5rem
  plate-outline:
    backgroundColor: transparent
    textColor: '{colors.line}'
    rounded: '{rounded.plate}'
    padding: 0 1.5rem
  plate-dark:
    backgroundColor: '{colors.panel}'
    textColor: '{colors.line}'
    rounded: '{rounded.plate}'
    padding: 0 1.5rem
  plate-outline-dark:
    backgroundColor: transparent
    textColor: '{colors.ink}'
    rounded: '{rounded.plate}'
    padding: 0 1.5rem
  worksheet-input:
    backgroundColor: '{colors.board-high}'
    textColor: '{colors.ink}'
    rounded: '{rounded.plate}'
    padding: 0.85rem 1rem
  choice:
    backgroundColor: '{colors.board-high}'
    rounded: '{rounded.plate}'
    padding: 0.5rem 1rem
  choice-selected:
    backgroundColor: '{colors.panel}'
    textColor: '{colors.line}'
  readback:
    backgroundColor: '{colors.panel}'
    textColor: '{colors.line}'
    rounded: '{rounded.plate}'
    padding: clamp(1.5rem, 2.5vw, 2.25rem)
---

# Design System: Dent Repair Pro

## Overview

**Creative North Star: "Reading the Reflection"**

The line board makes the surface readable. Gentian-blue paint carries pale reflections; cool matte board carries blue-black rules. Compressed headings deliver the argument, while practical text and square plates make the next action explicit.

Dent Repair Pro keeps the phone, (816) 694-6288, as the primary action. Verified facts constrain every proof element: rendered imagery is identified as illustration, not customer repair photography. The built hero uses a composite raster plate and a separate bounded WebGL demonstration, rather than the overlapping live reflection described in the original surface brief.

**Key Characteristics:**
- Two materials: reflective panel and unbending matte board.
- Compressed display caps, readable Archivo text, italic asides.
- Ruled information, square plates, full/half/hollow circular marks.
- Direct manipulation stays inside the demonstration.

## Colors

Gentian paint and cool board are the two materials; lamp amber marks interaction, not a third surface family. Primitive values above preserve the stylesheet, including its alpha colors.

### Primary
- **Gentian Paint** (`panel`): primary control fill and dark readback surface.
- **Lit Gentian** (`panel-high`) and **Paint Falloff** (`panel-deep`): panel gradient and hover/highlight versus deep stage backing.

### Secondary
- **Lamp Amber** (`amber`): slider thumb, progress, readout, selection, panel focus, and closing-number hover.

### Neutral
- **Reflected White** (`line`): primary panel text and pale plate fill.
- **Reflected Blue** (`line-soft`): panel prose and italic notes; **Navigation Reflection** (`line-nav`) keeps navigation separately tinted.
- **Matte Board** (`board`) and **Clean Board** (`board-high`): alternating reading sections and field fill.
- **Blue-Black Ink** (`ink`) and **Secondary Ink** (`ink-soft`): board text hierarchy.
- **Ink Hairline** (`ink-hair`), **Ink Rule** (`ink-rule`), and **Reflection Hairline** (`line-hair`): divisions appropriate to each material.
- **Placeholder Ink** (`placeholder`) and **Field Edge** (`field-border`): worksheet prompts and unselected controls.

**The Two Materials Rule.** Use pale text and reflection on panel; use blue-black text and straight rules on board. Do not bend the information surface.

**The Lamp Amber Rule.** Keep amber attached to interaction: the slider and readout, text selection, panel focus, and phone hover. Board focus is blue.

## Typography

**Display Font:** Big Shoulders Display, with Arial Narrow / Helvetica Neue / sans-serif fallback.
**Body Font:** Archivo, with Helvetica Neue / Arial / sans-serif fallback. Both families are self-hosted variable fonts; Archivo includes a separate italic face.

The condensed display face behaves like lettering on equipment, not body copy. Archivo carries explanations without compression. There is no mathematical scale: the observed hierarchy combines fluid headings with fixed component roles.

### Hierarchy
- **Display:** hero role in frontmatter; uppercase, balanced wrapping. At the narrow breakpoint its size changes to `clamp(3.4rem, 18vw, 5rem)`.
- **Headline:** section headings, balanced and limited to 14ch; FAQ heading uses 10ch on the wide layout.
- **Title:** process and readback headings. The demonstration title is a smaller local variant (1.6rem).
- **Category:** fit-column and photo-guide headings.
- **Body:** normal text; at the narrow breakpoint the base size becomes 1rem.
- **Intro:** explanatory prose limited to 62ch; hero lede uses 44ch, then 38ch on the stacked layout.
- **Label:** worksheet field labels. Controls use 1rem / 600 with 0.005em tracking.
- **Closing:** large telephone action, with `clamp(2.6rem, 13.5vw, 4rem)` at the narrow breakpoint.
- **Asides:** Archivo italic, typically 0.9–0.95rem, in the secondary tint of the current material.

**The Compressed Voice Rule.** Use Big Shoulders Display for uppercase headings and Archivo for reading, labels, and italic qualifications.

## Layout

A centered wrapper caps at 1240px with the fluid gutter token subtracted on both sides. Section padding and content-start spacing expand fluidly rather than using a universal spacing ratio. Action groups wrap, and the worksheet uses its own tighter vertical rhythm.

The wide hero is 52fr/48fr with bottom-aligned demonstration and centered copy; its minimum height is 100svh. Section heads and worksheet use 7fr/5fr. Fit information uses three equal columns, process imagery four, and FAQ uses 4fr/7fr. Readback and FAQ introduction stick at 1.5rem until their layouts collapse.

Responsive behavior follows max-width queries:
- **1100px:** process becomes two columns; section heads and FAQ stack; FAQ heading stops sticking.
- **900px:** worksheet/readback stack and the readback stops sticking.
- **820px:** navigation hides; masthead becomes two columns; hero and fit information stack; demo occupies a separate full-width row; footer stacks. The call bar becomes eligible for display and respects the safe-area bottom inset. The mobile hero uses its separate raster plate.
- **560px:** process becomes one column; phone text in the masthead is visually hidden but the call control remains; comparison spacing/type contracts; readback actions stack. Photo guides remain two columns.

The comparison remains a semantic three-column table rather than changing to unrelated cards. Closing reflection lines recede to the bottom on small screens.

## Elevation & Depth

Board sections are flat and separated by rules. Panel depth comes from tonal gradients, raster paint, reflection lines, and a subtle light overlay. The demonstration alone uses a translucent deep-blue backing and 14px backdrop blur. These material effects are not a general glass-card system.

### Shadow Vocabulary
- **Pale plate hover:** `0 10px 24px -12px rgba(2, 8, 40, 0.7)`.
- **Blue plate hover:** `0 10px 24px -14px rgba(21, 48, 154, 0.8)`.
- **Demonstration card:** `0 24px 48px -28px rgba(2, 8, 40, 0.9)`.
- **Slider thumb:** `0 4px 14px -6px rgba(2, 8, 40, 0.9)`.
- **Mobile call bar:** `0 14px 30px -14px rgba(2, 8, 40, 0.8)`.

**The Bounded Depth Rule.** Reserve blur and pronounced depth for the demonstration and floating call control; keep informational board sections ruled and flat.

## Shapes

Nearly square plates, fields, chips, cards, and image corners share the plate radius. The demonstration stage itself resolves to square corners. Control edges use 1.5px strokes; reading divisions use 1px hairlines and 2px section rules. Filled, half-filled, and hollow circle marks classify fit: outlined circles use a 1.5px stroke, while the solid circle is fill-only. FAQ and telephone symbols are inline SVG, not character glyphs.

## Components

### Buttons
Square plates are minimum-height 3.25rem controls, with 0 1.5rem padding and 600-weight Archivo. Pale filled and pale outlined variants belong on panel; blue filled and ink outlined variants belong on board. The readback remaps its buttons to the pale panel treatments regardless of their source class names. Filled hover lifts by 1px with the matching soft shadow; the stylesheet also specifies a 1px press translation. Outlined hover changes the border and adds a faint material tint. Disabled plates are dashed, 45% opaque, not-allowed, and have no lift or shadow.

Focus is a 3px outline offset by 3px: amber on panel, blue on board. Color transitions use 160ms; transform easing is `cubic-bezier(0.2, 0.8, 0.2, 1)`.

### Chips
Radio choices are rectangular white plates with the field edge, minimum height 2.75rem, and 0.5rem 1rem padding. Hover darkens the edge. Checked radios become panel blue with reflected-white text. Keyboard focus appears around the visible plate, not the visually concealed native input. State transitions use 140ms.

### Cards / Containers
The readback is an opaque panel-colored card with fluid padding, a display heading, live output, and call-first actions. The demo is a bounded translucent card, capped at 30rem wide on desktop, with 1.1rem 1.25rem padding, a reflection hairline, and an 8:5 stage. Do not generalize its blur to the worksheet or fit columns.

### Inputs / Fields
Text fields, select, and textarea use clean-board fill, field-edge borders, plate corners, and 0.85rem 1rem padding. Hover uses secondary ink for the edge; focus uses panel blue and reduces outline offset to 2px. Placeholder text has its own opaque ink token. Textarea resizing is vertical. The select uses an SVG chevron. No error treatment is established by this build.

### Navigation
The ruled masthead balances brand, centered section anchors, and a telephone plate. Navigation is Archivo 500 at 0.98rem with a transparent bottom edge that becomes reflected white on hover; focus uses the shared panel ring. It disappears below the 820px breakpoint without adding a menu. The fixed mobile call bar sits 0.75rem from each side and above the safe-area inset; its visibility is controlled by script rather than always showing.

### Reflection Demonstration
The labeled native range uses a 2px track, amber progress, and a nearly square 1.75rem thumb with a 2px ink border. WebKit thumb hover/active scales to 1.08; focus outlines the thumb in both engines. The live status describes the dent, and the readout uses tabular numerals. The static illustration remains the no-JavaScript/no-WebGL fallback; nonfunctional manipulation controls are hidden in those modes.

### Ruled Information and Disclosure
Fit columns use circle marks and horizontal rules instead of enclosing cards. Process plates use a 16:10 crop, ruled captions, and compact display headings. Comparison cells use reflection hairlines and differing text emphasis. FAQ uses native details/summary, blue hover, a plus whose vertical SVG stroke rotates and fades when open, and answers limited to 62ch.

### Motion
State changes are brief: fields/thumb 140ms, plates/navigation 160ms, FAQ rotation 220ms, and call-bar reveal 260ms. Reduced motion switches smooth scrolling off and reduces transitions and animations to 0.01ms. These snippets document native visual states, not replacements for the site's WebGL or call-bar scripts.

## Do's and Don'ts

### Do:
- Do preserve the panel/board text pairing and contextual focus rings.
- Do keep (816) 694-6288 as the primary action for Dent Repair Pro.
- Do label generated and rendered imagery as illustration and use verified facts only.
- Do retain native field labels, radio semantics, range keyboard input, and details/summary disclosure.
- Do preserve static demonstration fallbacks and reduced-motion treatment.

### Don't:
- Don't turn the board into a distorted reflective surface.
- Don't substitute pill buttons for the square plate controls.
- Don't present rendered plates as customer repair evidence.
- Don't turn the worksheet into an implied quote submission.
