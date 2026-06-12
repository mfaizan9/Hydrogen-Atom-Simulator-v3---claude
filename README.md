# Hydrogen Atom Simulator (HTML5)

Accessible HTML5 conversion of the NAAP *Hydrogen Energy Levels* Flash simulation,
built on the shared KL-UNL foundation.

## This sim must be served over HTTP. It will NOT run from a double-clicked `file://` path.

**Why:** the KL-UNL masthead (`foundation/kl-unl-masthead.js`) loads its title and
its Help / About text with `fetch('foundation/contents.json')`. Browsers block
`fetch()` of local files over the `file://` protocol (same-origin policy), so
double-clicking `index.html` shows an empty or broken masthead. Served over HTTP the
fetch succeeds and the sim loads normally.

## How to run locally

Open a terminal **inside this `html5/` folder**, start any static server, then open
the printed URL:

```
python3 -m http.server 8123
```

**Link to paste in your browser:** http://localhost:8123/

Other servers work too:

```
npx serve          # or: npx http-server
```

or the VS Code **Live Server** extension.

Because you serve from inside `html5/`, the sim is at the server root, so the URL is
`http://localhost:8123/` — **not** `.../html5/index.html`.

## Production

When deployed to the cloud host (served over HTTP/HTTPS) it just works. The `file://`
limitation only affects local double-clicking.

## What's in here

```
index.html            KL-UNL scaffold: .app-shell + <kl-unl-masthead> + panels
foundation/           shared KL-UNL files, copied in UNCHANGED
                        kl-unl-masthead.js, kl-unl.css, kl-unl.js,
                        contents.json (with this sim's "hydrogenatom" entry added)
styles/styles.css     sim-specific styles only
simulation.js         all sim logic (verbatim physics model + accessible UI layer)
assets/fonts/         Verdana / WP Greek Century (the original's embedded fonts)
assets/mathjax/       MathJax 3 (the full local es5 distribution)
CONVERSION_NOTES.md   behavior model, AS->HTML5 mapping, deviations
ACCESSIBILITY.md      WCAG affordances added
```

No build step, no bundler, no framework, no CDN, no analytics. The only runtime
network requests are local files. All mathematics is typeset with **MathJax 3**, fed
LaTeX through the foundation's `klunlShowEquation` helper. MathJax is **vendored
locally** (the complete `assets/mathjax/` es5 tree, loaded via `tex-mml-svg.js`) so that
its **right-click contextual menu** — *Show Math As → MathML / TeX*, *Copy to
Clipboard*, etc. — works fully offline; that menu lazy-loads extra components
(MathML input, the speech-rule engine, …) which must be present locally.
