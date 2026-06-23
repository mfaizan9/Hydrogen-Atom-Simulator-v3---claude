# Accessibility Notes — Hydrogen Atom Simulator

Target: WCAG 2.1 AA (AAA where reasonable). Built on the KL-UNL foundation, which
supplies the palette, focus-visible ring, `.sr-only`, and the accessible masthead
dialog. **Human screen-reader QA is still required** — the notes below describe the
affordances built in, not a substitute for testing with real assistive technology.

## Structure & landmarks
* One `<h1>` — the simulation title — is rendered by `<kl-unl-masthead>`. The sim adds
  only `<h2>` panel headings (`Atom Diagram`, `Photon Selection`, `Energy Level
  Diagram`, `Event Log`, `Animation`), in a non-skipping order.
* `<main class="app-layout">` wraps the panels; each panel is a `<section>` labelled by
  its heading. The event log is an `<ol role="log">`.
* `<html lang="en">`. A "Skip to controls" link is the first focusable element.

## Text alternatives (1.1.1)
* The atom-diagram canvas and the two SVG diagrams each have `role="img"` +
  `aria-label` and an associated `aria-live="polite"` description region (`#atom-desc`,
  `#scale-desc`, `#photon-desc`) that states the current electron level and energy,
  updated whenever state changes.
* Equations are typeset by **MathJax** from LaTeX (frequency, wavelength, photon
  energy, `E_n = −13.6/n²`) via `klunlShowEquation`, each paired with a spoken
  description string (`#freq-sr`, `#wave-sr`, `#energy-sr`, `#energy-level-sr`). The
  visible MathJax output is `aria-hidden` so screen readers use the prose string,
  avoiding double reading.

## Color & contrast (1.4.x) — never color alone
* HTML text/controls use the KL-UNL palette (≥ 4.5:1). Inside the canvas diagrams the
  original physically-meaningful colors are kept (the photon color encodes its real
  wavelength; the active energy level is red) **but are always paired with text**: the
  active level shows "level N / −X.X eV", the ionized state shows the word "ionized",
  the log names every transition (e.g. "absorbed (Lα)"), and the live regions narrate
  each change. No state is conveyed by color alone.

## Keyboard (2.1.x, 2.4.7)
* Everything is operable by keyboard in a logical tab order with the foundation's
  visible focus ring. No keyboard traps; the masthead dialog manages its own focus.
* **Sliders are fully keyboard-operable** (native `<input type="range">`):
  * `#photon-range` — select photon energy. Left/Down decrement, Right/Up increment,
    Page Up/Down larger steps, Home/End min/max. `aria-valuetext` announces the
    selected energy, wavelength, frequency (and the transition name when snapped).
* The **electron level** is a native `<select>` dropdown (levels 1–6) — the keyboard
  equivalent of dragging the electron on the canvas. Both paths mutate the same state.
* Fire, the 12 preset transition buttons, clear-log, and pause are native `<button>`s
  (KL-UNL blue with white, enlarged text for legibility).

## Pointer / touch (2.5.x, responsive)
* The electron can be dragged on the canvas with Pointer Events (mouse + touch);
  `touch-action: none` on the atom canvas prevents the drag from scrolling the page.
  Pointer coordinates are mapped back through the canvas scale so the original
  nearest-level snapping math runs in stage coordinates at any display size.
* Interactive targets meet the ≥ 44 px (2.75 rem) minimum from the foundation `.button`
  / control styles. No hover-only affordances. **Exception:** the 12 preset transition
  buttons are deliberately small (~25 px) and packed because they are positioned along
  the energy axis at each transition's energy (reproducing the original layout); they
  remain fully keyboard-operable (Tab + Enter/Space) with descriptive `aria-label`s, and
  the slider + Fire button provide a large-target alternative for choosing/firing a
  photon. Flagged for human QA on touch devices.

## Live region / announcements (4.1.3)
* `#sr-status` (`aria-live="polite"`) announces each committed event in wording
  consistent with the on-screen log, e.g. *"Excitation. 10.20 eV photon absorbed
  (Lyman alpha). Electron moved from level 1 to level 2."*, plus reset, clear-log, and
  pause/resume. Announcements fire on commit (slider `change`, button click, animation
  completion), not on every animation tick.

## Timing / motion (2.2.2, 2.3.3)
* No content flashes more than three times per second.
* `prefers-reduced-motion: reduce` collapses the diagram animation durations (electron
  slide, photon travel) to near-instant and disables the log color fade, so the end
  state is shown without continuous motion. Physics outcomes are unchanged.
* A **Pause** button stops the animation clock for users who need motion to stop.
  (Reset is provided by the masthead via the `sim-reset` event — not duplicated.)

## Zoom / reflow (1.4.4, 1.4.10)
* Body text is ≥ 1.125 rem, sized in rem/em so it tracks the browser font setting.
  Layout uses the KL-UNL grid plus sim breakpoints at 56 rem and 34 rem; it reflows to
  a single stacked column at phone-portrait widths with no horizontal scrolling and no
  clipped text. Canvases scale with `width:100%; height:auto` (aspect preserved).

## Known limitations / still-to-QA
* The energy diagram and the three photon scales are inline **SVG** (vector, so they
  stay crisp at any browser zoom and match the foundation's high-contrast colors). Their
  tick/level labels are SVG `<text>` (figure labels) rather than HTML, so they scale with
  the graphic but not independently with the browser text-zoom setting; the exact values
  are also exposed as MathJax readouts, `aria-valuetext`, and the live description
  regions.
* Animation is driven by `requestAnimationFrame`, so it pauses when the browser tab is
  hidden (and a manual Pause button is provided). This is expected, motion-friendly
  behavior.
* Real screen-reader passes (VoiceOver / NVDA / JAWS) and a keyboard-only pass are
  recommended before release, especially around the `role="log"` announcement cadence
  and MathJax SVG output being correctly skipped in favor of the prose descriptions.
