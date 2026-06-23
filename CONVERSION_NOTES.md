# Hydrogen Atom Simulator — Flash → HTML5 (KL-UNL) Conversion Notes

Source: `hydrogenAtom033.swf` / `hydrogenAtom033.fla` (decompiled with JPEXS).
Original: Nebraska Astronomy Applet Project (NAAP), *Hydrogen Energy Levels* module.
Original Flash stage: 950 × 640 px.

## Behavior model (one paragraph)

This simulator teaches the Bohr model of the hydrogen atom — how it absorbs and emits
light. A single electron sits in one of six quantized levels, drawn as nested white
arcs around a proton in the black **Atom Diagram**. The user picks a photon in the
**Photon Selection** panel — by moving a slider over three linked scales
(frequency / wavelength / energy), or by pressing a preset transition button (Lyman
Lα–Lε, Balmer Hα–Hδ, Paschen Pα–Pγ) — then fires it. Outcomes: **excitation** (the
photon energy exactly matches a transition from the current level → the electron jumps
up); **ionization** (energy exceeds the binding energy 13.6/n² → the electron is
ejected and the atom shows an "ionized" marker); or **no absorption** (the photon
passes through). An excited atom **spontaneously de-excites** after a delay (emitting a
photon); an ionized atom **recombines** then cascades down — both choosing target
levels from fixed probability tables via `Math.random`. The **Energy Level Diagram**
shows every level on a −13.6…0 eV scale with the current one highlighted, and the
**Event Log** records each absorption / emission / ionization / recombination. You may
also drag the electron directly between levels (this clears the log).

## Two goals

* **Goal A — functional parity (exact).** All constants, tables, formulas, number
  formatting, and on-screen / log text are ported VERBATIM from the ActionScript. See
  the model layer in `simulation.js` (Sections 1–4).
* **Goal B — accessible KL-UNL presentation.** The original Flash chrome (title bar,
  panel frames, slider widget, preset buttons, scrollbar, draggable About/Help dialogs)
  is **not** reproduced pixel-for-pixel. The sim is rendered inside the KL-UNL shell
  with the `<kl-unl-masthead>` component and the foundation CSS classes, and every
  control is a native, keyboard-operable element. Only genuinely code-drawn dynamic art
  is kept on `<canvas>`.

Where A and B conflict, B wins and the deviation is recorded below; the underlying
physics is never changed to satisfy B.

## Rendering architecture

The original is **entirely code-drawn vector art** (no exported bitmaps; `images/` is
empty, and `shapes/*.svg` are UI chrome replaced by foundation CSS / native controls).

* **Atom Diagram** — kept on a `<canvas>` (`#atom-canvas`, 769 × 250) because it is
  genuinely dynamic, animated art: orbits, proton, electron + ghost, streaming photons,
  transition dots, and the ionized "+" marker. It draws in the original Flash **stage
  coordinates** (translated `(−7.0, −37)` so the atom box fills the canvas); CSS scales
  the element to fit, aspect preserved.
* The **Energy Level Diagram** is **redrawn from scratch as crisp inline SVG**
  (`#scale-diagram`), and the **photon frequency/wavelength/energy scales** as positioned
  HTML with MathJax labels (`#photon-bars`), both generated in JS. They replace the
  original's cramped 20-tick canvas because they stay sharp at any zoom and match the
  foundation's high-contrast colors
  (`#1a1a1a` lines/text, `#c1272d` for the current selection). The energy diagram
  places the level lines **to scale at `E_n = −13.6/n²` eV**, so the 0 eV ionization
  limit sits proportionally just above the bunched upper levels (n ≥ 3). Following the
  original, the resulting crowding is handled by labelling **only the current level** —
  the `n=N` / energy label (red) moves to whichever level the electron is on; the other
  levels are plain tick lines. The photon scales share one energy axis (so one marker
  shows the photon on all three). These are Goal-B (clarity/accessibility) presentation
  choices; the physics is unchanged.

The three photon scales are **positioned HTML** (not SVG) so their tick labels can be
real **MathJax** (`10^{14}`, `500\,\text{nm}`, …). Each label is centered on its tick and
bottom-aligned with the others on a single row; the small label font keeps even the
bunched long-wavelength labels from colliding. The red selection marker is an absolutely
positioned element moved by percentage.

Layout: all four panels live in one responsive grid driven by `grid-template-areas`
(`.sim-grid`), so they rearrange across breakpoints without changing the DOM (reading
order stays atom → energy → photon → log):
* **Large desktop (≥ 70 rem):** `atom | energy` over `photon | log`. The right column is
  a fixed width, so the Energy Level Diagram and Event Log are exactly equal width and the
  Atom Diagram / Photon Selection take the wider remaining space.
* **Reduced / tablet (44–70 rem):** Atom full width, then **Energy Level Diagram ‖ Event
  Log** side by side, then Photon Selection full width.
* **Phone portrait (< 44 rem):** single stacked column.

Atom and Energy stretch to equal height when side by side (the energy diagram is sized a
little smaller so the Atom box is the reference and their bottoms line up); Photon and Log
stay top-aligned. The Pause-animation button sits at the bottom of the Atom Diagram panel
(centered); the Fire-photon button is centered in its panel. Panel headings are padded to
line up with the masthead title ("Hydrogen Atom Simulator").

**Masthead Help label:** the shared masthead labels its help button "Review Help Guide"
until first opened; this sim relabels it to just "Help" at runtime by reaching into the
component's (open) shadow root from `simulation.js` — the foundation file itself is left
byte-for-byte unchanged.

Everything else is native HTML: the **electron level** is a `<select>` dropdown; the
photon **energy slider** is an `<input type="range">`; the three **readouts**
(MathJax), **Fire photon**, **preset transition** buttons, **Clear log**, and the
**event log** (`<ol role="log">`) are real DOM elements; the **title bar / Reset /
Help / About** come from `<kl-unl-masthead>`.

### AS-construct → HTML5 mapping

| ActionScript 1 | HTML5 |
|---|---|
| `Object.registerClass` + `prototype = new MovieClip()` | plain JS classes (`Simulator`, `AtomDiagram`, `EnergyBar`, `EnergyScale`, `LogComponent`, `LogEntry`, `StreamingPhotons`) |
| `onEnterFrame` | one `requestAnimationFrame` loop calling each object's active `onEnterFrame` |
| `getTimer()` | `performance.now()` relative to load; **all ms constants kept** (`standardDecayTime=2500`, `transitionTime=1500`, `nullAnimationTime=1538`, …) |
| `drawArc`, `beginFill`/`lineTo`, `setMask` | `ctx.arc`, `ctx.fill`/`fillRect`, `ctx.clip()` with the same coordinates |
| radial-gradient proton / electron fills | `ctx.createRadialGradient` with the exported stop colors (`#02d702→#017801`, `#f30101→#9e0101`) |
| `_x,_y,_alpha,_rotation` | object props applied at draw time |
| `Number.prototype.toFixed` polyfill | ported verbatim (`toFixed()`) |
| Title bar / About / Help dialog (drawn + hit-tested) | the shared `<kl-unl-masthead>` component (title + Reset/Help/About) |
| Energy Bar slider widget + grabber + bar auto-advance | native `<input type=range>` (the grabber); the bar-press auto-advance behavior is dropped (a native slider is directly draggable and fully keyboard-operable) |
| Fire / preset (FPushButton) buttons | native `<button>` elements (KL-UNL blue, white text) |
| drag-the-electron between levels | a native `<select>` dropdown (keyboard path) **and** pointer drag on the canvas, both mutating the same state |
| Log Component + FScrollBar | a native scrollable `<ol role="log">`; the canvas scrollbar/slide-in is dropped |
| `trace()` | dropped |

### Verbatim physics constants / tables (copied, never rounded)

* `E_n = −13.6/n²` eV; ionization energy `13.6/n²`; absorbed/emitted `13.6·(1/n₁²−1/n₂²)`.
* `decayTable`, `recombinationTable`, `photonTransitionIDTable` — copied exactly.
* `levelPositions = [22,78,175,310,486,700]`; `scale = 584/15` px/eV.
* Photon color spectrum table and `getPhotonStyleFromWavelength` thresholds — copied exactly.
* Wavelength↔frequency: `λ(nm)=1240/E`, `f=c/λ` with `c=299792458`.
* Scientific-notation and `toFixed` formatting reproduce the source's exact digits.
* The randomized decay/recombination target selection uses the same cumulative-
  probability loop over the source's tables with `Math.random`.

### Greek transition subscripts

The source labels lines with a WordPerfect-Greek font where the ASCII bytes `" $ ( * g`
render as `α β γ δ ε`. Those raw bytes appear in the AS (`transitionsTable`). JS maps
them to Unicode Greek so the buttons and log read `Lα … Pγ` regardless of browser cmap.
Screen-reader labels spell them out ("Lyman alpha", "Balmer beta", …).

## Equations (MathJax)

All mathematics is rendered with **MathJax**, fed **LaTeX** through the foundation
helper `klunlShowEquation` (which sets the container's content and calls
`MathJax.typesetPromise`), each paired with a screen-reader description string. Because
CDNs are not permitted (Hard Rule 5), MathJax is **vendored locally** as the full
`assets/mathjax/` es5 tree (loaded via `tex-mml-svg.js`). The complete tree is required
because the MathJax **contextual menu is enabled**: right-clicking any equation offers
"Show Math As" (MathML / TeX Commands), "Copy to Clipboard", and accessibility settings,
and those features lazy-load extra components (MathML input, the speech-rule engine,
mathmaps) that must be present locally for the menu to work offline. Equations:

* Photon **frequency** readout: `f = coefficient × 10^exponent Hz` (scientific notation).
* Photon **wavelength** readout: `λ = value nm` / `µm`.
* Photon **energy** readout: `E = value eV`.
* **Energy Level Diagram**: `E_n = −13.6/n² = −value eV` for the current level
  (`E > 0 (ionized)` when ionized).
* The **tick labels on the three photon scale bars** (`10^14` Hz, `500 nm`, `0…15` eV, …)
  are also MathJax, typeset once when the bars are built.
* **Preset transition buttons** show the line as MathJax (`L_α`, `H_β`, `P_γ`, …); the
  plain-language name stays on each button's `aria-label` for screen readers. As in the
  original, each button is positioned along the energy axis at its transition's energy
  (aligned with the bars and slider) and staggered into two rows so the converging Lyman
  lines stay clickable.
* **Event Log** entries render their math/symbols with MathJax — the transition
  (`1 → 2`, `1 → ∞`), the photon energy (`10.20 eV`), and the line descriptor (`L_α`) —
  typeset per entry as it is added; the type word (excitation/…) stays plain text.

## The contents.json entry (already present)

`foundation/contents.json` already contains the `hydrogenatom` entry (meta + Help +
About), kept in alphabetical order with the sibling sims. The Help/About wording is
derived from the original Flash About/Help text reflowed into the shared boilerplate
(funding NSF #0231270 / #0404988; noncommercial-use permission; `astro.unl.edu/naap`).
This per-sim copy is the only edited foundation file; the `.js`/`.css` foundation files
are copied in byte-for-byte unchanged.

## Deviations from the original (Goal B over Goal A, recorded)

1. **Layout / chrome.** The atom diagram and the Photon Selection panel each span the
   full width; below them the **Energy Level Diagram** and **Event Log** sit side by
   side. It collapses to a single stacked column (atom → photon → energy → log) at the
   foundation's 56 rem breakpoint and on phone portrait. This uses KL-UNL classes/grid,
   not the original pixel layout. Colors/fonts follow the KL-UNL palette except inside
   the atom-diagram canvas, which keeps the original art colors.
2. **Slider behavior.** The original "press on the bar to nudge / auto-advance the
   grabber" interaction is replaced by a standard native range slider (directly
   draggable, full keyboard support). Snapping to transition energies (within 3 px) is
   preserved; on snap the thumb jumps to the snapped value.
3. **Energy / photon diagrams redrawn.** The original's cramped 20-tick energy scale and
   busy triple-axis bar are redrawn as clean, high-contrast inline SVG / HTML (see
   Rendering architecture). The energy diagram is **to scale (`E_n = −13.6/n²`)** with
   only the current level labelled (as in the original) so the ionization limit stays
   proportional and the bunched upper levels don't collide; the photon bars share one
   energy axis with tick labels spaced (and the wavelength row staggered) so they never
   collide.
4. **Event log.** The custom Flash scrollbar is replaced by native list scrolling. Log
   text is high-contrast dark (`#1a1a1a`) — the original's red→grey fade is replaced by
   a brief background highlight on new entries that settles (text stays dark; disabled
   under reduced motion).
5. **Reduced motion.** With `prefers-reduced-motion: reduce`, the visual animation
   durations (electron slide, photon travel) collapse to near-instant, and the log
   highlight is disabled. Physics outcomes and the post-event wait delays are unchanged.
6. **Pause.** A Pause button gates the animation clock (the original had none); on
   resume any in-flight animation completes. (Animation also pauses naturally when the
   browser tab is hidden, as it is driven by `requestAnimationFrame`.)
