"use strict";
/* ============================================================================
 * Hydrogen Atom Simulator  -  HTML5 / KL-UNL accessible conversion
 * Source: hydrogenAtom033.swf / .fla  (NAAP, "Hydrogen Energy Levels" module),
 *         decompiled with JPEXS.
 *
 * GOAL A (functional parity): the model layer below -- The Simulator, Atom
 *   Diagram, Energy Bar, Energy Scale, Log Component, Streaming Photons, plus the
 *   toFixed / scientific-notation helpers -- is a verbatim port of the original
 *   ActionScript-1 prototype classes. Every physics constant, table, formula, and
 *   piece of displayed text is copied unchanged from the source.
 *
 * GOAL B (accessible KL-UNL presentation): the original's canvas-drawn chrome
 *   (title bar, panels, slider widget, preset buttons, scrollbar, About/Help
 *   dialogs) is NOT reproduced pixel-for-pixel. Instead the sim is rendered inside
 *   the shared KL-UNL shell: the <kl-unl-masthead> provides the title + Reset /
 *   Help / About; panels use the foundation CSS classes; and every control is a
 *   native, fully keyboard-operable element. Only the genuinely code-drawn dynamic
 *   art (the atom-diagram orbits/electron/proton/photons, the energy-level scale,
 *   and the three photon axes) is drawn on <canvas>. Equations are rendered as
 *   MathML through the foundation's klunlShowEquation helper.
 *
 * Timing: getTimer() -> performance.now()-relative ms; all original ms constants
 * are kept. onEnterFrame handlers -> a single requestAnimationFrame loop.
 * ========================================================================== */

/* ===========================================================================
 * SECTION 1 -- VERBATIM HELPERS (ported from toFixed.as / Scientific Notation)
 * ========================================================================== */

const _t0 = performance.now();
function getTimer() { return performance.now() - _t0; }   // ms since load (Flash getTimer)

// AS Number.prototype.toFixed polyfill -- round-half-up, matches the source exactly.
function toFixed(x, f) {
  if (f < 0 || f > 20) return "Range Error";
  if (isNaN(x)) return "NaN";
  let s = "";
  if (x < 0) { s = "-"; x = -x; }
  let m = "";
  if (x < 1e21) {
    const n = Math.round(x * Math.pow(10, f));
    m = (n === 0) ? "0" : n.toString();
    if (f > 0) {
      let k = m.length;
      if (k <= f) {
        let z = "";
        for (let i = 0; i < f + 1 - k; i++) z += "0";
        m = z + m; k = f + 1;
      }
      const a = m.substr(0, k - f);
      const b = m.substr(k - f);
      m = a + "." + b;
    }
  } else {
    m = x.toString();
  }
  return s + m;
}

// Scientific Notation Number.as -> {coefficient, exponent} (used for the frequency).
function sciNotation(num, sigFigs) {
  const digs = sigFigs;
  if (num === 0) {
    let cstr = "0";
    const extra = digs - 1;
    if (extra !== 0) { cstr += "."; for (let i = 0; i < extra; i++) cstr += "0"; }
    return { coefficient: cstr, exponent: "0" };
  }
  let coeff = "";
  if (num < 0) { coeff = "-"; num = Math.abs(num); }
  let expo = Math.floor(Math.log(num) / 2.302585092994046);
  const expoFact = Math.pow(10, -expo);
  const fact = Math.pow(10, digs - 1);
  let num2 = Math.round(fact * expoFact * num) / fact;
  if (num2 >= 10) { num2 /= 10; expo++; }
  let cstr = String(num2);
  const dot = cstr.indexOf(".");
  let addDot = (dot === -1);
  let sigfigs = 0;
  for (let i = 0; i < cstr.length; i++) {
    const code = cstr.charCodeAt(i);
    if (code > 47 && code < 58) sigfigs++;
  }
  const numZeros = digs - sigfigs;
  if (numZeros > 0 && addDot) cstr += ".";
  for (let i = 0; i < numZeros; i++) cstr += "0";
  coeff += cstr;
  return { coefficient: coeff, exponent: String(expo) };
}

function rgb(n) { return "#" + (n & 0xffffff).toString(16).padStart(6, "0"); }

/* ===========================================================================
 * SECTION 2 -- GEOMETRY (stage coordinates, verbatim from the SWF matrices)
 * The original stage is 950x640; The Simulator is placed at (0,30).
 * Only the dynamic, code-drawn art keeps these coordinates; chrome is HTML.
 * ========================================================================== */

const SIM_Y = 30;

// --- Atom Diagram --- proton/orbit-center on stage = (7.1, 162).
const AD = {
  ox: 7.1, cy: 132 + SIM_Y,
  width: 769, halfHeight: 125,
  boxL: 7.1 - 0.1, boxT: 132 + SIM_Y - 125, boxW: 769, boxH: 250,
  occupiedOrbitAlpha: 80, unoccupiedOrbitAlpha: 30,
  levelPositions: [22, 78, 175, 310, 486, 700],
  transitionProgressDotSpacing: 12,
  photonSpeed: 500,
  transitionTime: 1500,
  ionizationAngleSpread: 2.6,
  ionizationSpeedRate: 0.05,
  minIonizationSpeed: 0.1,
  recombinationSpeed: 0.15,
  ionizedX: 7.1 + 737.2, ionizedY: 162 - 100.5
};
AD.orbitAlphaRange = AD.occupiedOrbitAlpha - AD.unoccupiedOrbitAlpha;
AD.nullAnimationTime = 1000 * AD.width / AD.photonSpeed;   // 1538 ms

// --- Energy Bar (Photon Selection) --- local origin on stage = (45, 554.1).
const EB = {
  ox: 45, oy: 524.1 + SIM_Y,
  maxSnapLevel: 3, maxLevel: 6,
  barWidth: 584, snapDistance: 3, maxSnapLevelPx: 3,
  freqTickY: 554.1 - 201, waveTickY: 554.1 - 137, energyTickY: 554.1 - 72
};
EB.scale = EB.barWidth / 15;                 // 38.9333 px per eV
EB.boxes = {
  freq:  { x: EB.ox - 31, y: EB.oy - 220, w: 648, h: 45 },
  wave:  { x: EB.ox - 31, y: EB.oy - 155, w: 648, h: 45 },
  energy:{ x: EB.ox - 31, y: EB.oy - 90,  w: 648, h: 45 }
};
EB.freqTicks  = [16.1, 161.0, 322.1, 483.1];
EB.waveTicks  = [4.8, 48.3, 96.6, 241.4, 482.7];
EB.energyTicks = [];
for (let i = 0; i <= 15; i++) EB.energyTicks.push(EB.scale * i);
EB.energyLongTicks = [0, 5 * EB.scale, 10 * EB.scale, 15 * EB.scale];
EB.sliderY = 554.1;
EB.regionY = 554.1 - 37.3;

// --- Energy Scale (Energy Level Diagram) --- level-1 baseline at stage (863,273.6).
const ES = {
  ox: 863, oy: 243.6 + SIM_Y,
  maxLevel: 20, ionizationHeight: 175, highestLevelHeight: 150,
  panelL: 783, panelR: 943, panelT: 37, panelB: 287
};
ES.yScale = -ES.highestLevelHeight / 13.6;

/* ===========================================================================
 * SECTION 3 -- VERBATIM TABLES + Greek subscripts
 * ========================================================================== */

// WordPerfect-Greek bytes -> Unicode Greek (the source labels lines this way).
const GREEK = { '"': "α", "$": "β", "(": "γ", "*": "δ", "g": "ε" };
const GREEK_NAME = { '"': "alpha", "$": "beta", "(": "gamma", "*": "delta", "g": "epsilon" };
const GREEK_LATEX = { '"': "\\alpha", "$": "\\beta", "(": "\\gamma", "*": "\\delta", "g": "\\epsilon" };
// Spectral-line label as LaTeX, e.g. L-alpha -> \(\mathrm{L}_{\alpha}\)
function transitionLatex(letter, subscript) {
  return `\\(\\mathrm{${letter}}_{${GREEK_LATEX[subscript] || ""}}\\)`;
}
function greekSub(ch) { return GREEK[ch] || ch; }

// transitionsTable (Generic Entry) - letter + raw subscript char (verbatim).
const transitionsTable = [
  { letter: "L", subscript: '"' }, { letter: "L", subscript: "$" }, { letter: "L", subscript: "(" },
  { letter: "L", subscript: "*" }, { letter: "L", subscript: "g" }, { letter: "H", subscript: '"' },
  { letter: "H", subscript: "$" }, { letter: "H", subscript: "(" }, { letter: "H", subscript: "*" },
  { letter: "P", subscript: '"' }, { letter: "P", subscript: "$" }, { letter: "P", subscript: "(" }
];

// Photon color by wavelength (nm) -- getPhotonStyleFromWavelength (Atom Diagram).
function getPhotonStyleFromWavelength(wavelength) {
  const dw = (wavelength - 380) / 340;
  let color;
  if (dw < 0) color = 9044223;          // UV
  else if (dw > 1) color = 16711738;    // IR
  else {
    const spectrum = [
      [0, 138, 0, 255], [0.24313725490196078, 90, 27, 255], [0.28627450980392155, 16, 151, 223],
      [0.4196078431372549, 0, 255, 192], [0.5058823529411764, 36, 255, 0],
      [0.5529411764705883, 233, 236, 0], [0.6823529411764706, 255, 23, 0], [1, 255, 0, 58]
    ];
    let k = 0;
    while (dw > spectrum[++k][0]) {}
    const frac = (dw - spectrum[k - 1][0]) / (spectrum[k][0] - spectrum[k - 1][0]);
    const r = frac * (spectrum[k][1] - spectrum[k - 1][1]) + spectrum[k - 1][1];
    const gg = frac * (spectrum[k][2] - spectrum[k - 1][2]) + spectrum[k - 1][2];
    const b = frac * (spectrum[k][3] - spectrum[k - 1][3]) + spectrum[k - 1][3];
    color = (r << 16) | (gg << 8) | b;
  }
  return { thickness: 2, color: color };
}

/* ===========================================================================
 * SECTION 4 -- MODEL CLASSES (verbatim port of the AS prototype classes)
 * ========================================================================== */

class StreamingPhotons {
  constructor() {
    this._photonList = [];
    this._timeLast = getTimer();
    this._speed = 500 / 1000;
  }
  setSpeed(arg) { this._speed = arg / 1000; }
  addPhoton(startPoint, endPoint, style, definition) {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const angle = Math.atan2(dy, dx);
    this._photonList.push({
      startX: startPoint.x, startY: startPoint.y,
      lastX: startPoint.x, lastY: startPoint.y,
      pos: 0, length: Math.sqrt(dx * dx + dy * dy),
      freq: (2 * Math.PI) / definition.wavelength,
      amp: definition.amplitude,
      color: style.color, thickness: style.thickness,
      cos: Math.cos(angle), sin: Math.sin(angle)
    });
  }
  tick() {
    const timeNow = getTimer();
    const dpos = this._speed * (timeNow - this._timeLast);
    const list = this._photonList;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.pos += dpos;
      if (p.pos >= p.length) { p.pos = p.length; list.splice(i, 1); }
    }
    this._timeLast = timeNow;
  }
  draw(g, offX, offY) {
    const TRAIL = StreamingPhotons.TRAIL_LEN;
    const list = this._photonList;
    g.lineCap = "round";
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      const head = p.pos;
      const tail = Math.max(0, head - TRAIL);
      const span = head - tail;
      if (span <= 0) continue;
      const steps = Math.max(2, Math.ceil(span / 1.2));
      g.lineWidth = p.thickness;
      g.strokeStyle = rgb(p.color);
      let prevX, prevY, have = false;
      for (let k = 0; k <= steps; k++) {
        const x_ = tail + span * (k / steps);
        const y_ = p.amp * Math.sin(x_ * p.freq);
        const X = p.startX + x_ * p.cos - y_ * p.sin + offX;
        const Y = p.startY + x_ * p.sin + y_ * p.cos + offY;
        if (have) {
          g.globalAlpha = (x_ - tail) / span;
          g.beginPath(); g.moveTo(prevX, prevY); g.lineTo(X, Y); g.stroke();
        }
        prevX = X; prevY = Y; have = true;
      }
    }
    g.globalAlpha = 1;
  }
}
StreamingPhotons.TRAIL_LEN = 10 * 0.5 * (1000 / 30);

class AtomDiagram {
  constructor(sim) {
    this.sim = sim;
    this.electronLevel = 1;
    this.levelPositions = AD.levelPositions;
    this.orbitAlpha = [AD.occupiedOrbitAlpha, AD.unoccupiedOrbitAlpha, AD.unoccupiedOrbitAlpha,
                       AD.unoccupiedOrbitAlpha, AD.unoccupiedOrbitAlpha, AD.unoccupiedOrbitAlpha];
    this.e1 = { x: AD.levelPositions[0], y: 0, alpha: 100 };
    this.e2 = { x: 0, y: 0, alpha: 0 };
    this.ionizedVisible = false;
    this.photons = new StreamingPhotons();
    this.onEnterFrame = null;
    this.transitionProgressVisible = false;
    this.transitionProgressX = 0;
    this.transitionProgressAlpha = 100;
    this.transitionProgressMaskX0 = 0; this.transitionProgressMaskX1 = 0;
  }
  get animationIsInProgress() { return this.onEnterFrame != null; }
  setOrbitAlpha(level, a) { if (isFinite(level) && level >= 1 && level <= 6) this.orbitAlpha[level - 1] = a; }

  draggingStart() {
    this.onEnterFrame = null;
    this.transitionProgressVisible = false;
    this.e1.alpha = 40; this.e1.y = 0;
    this.e2.alpha = 100; this.e2.x = this.e1.x; this.e2.y = 0;
  }
  draggingEnd() { this.e1.alpha = 100; this.e2.alpha = 0; }

  startElectronTransition(newLevel) {
    const oldLevel = this.electronLevel;
    const xOld = this.levelPositions[oldLevel - 1];
    const xNew = this.levelPositions[newLevel - 1];
    this.transitionProgressMaskX0 = xOld;
    this.transitionProgressMaskX1 = xNew;
    this.transitionProgressVisible = true;
    this.transitionProgressAlpha = 100;
    this.oldLevel = oldLevel; this.newLevel = newLevel;
    if (isFinite(oldLevel)) this.orbitAlpha[oldLevel - 1] = AD.occupiedOrbitAlpha;
    if (isFinite(newLevel)) this.orbitAlpha[newLevel - 1] = AD.unoccupiedOrbitAlpha;
    this.e1.x = xNew; this.e1.y = 0; this.e1.alpha = 0;
    this.e2.x = xOld; this.e2.y = 0; this.e2.alpha = 100;
    if (newLevel < oldLevel) {
      this.transitionDirection = -1; this.transitionOffset = AD.width;
      this.transitionProgressX = AD.width; this.transitionProgressXScale = -1;
    } else {
      this.transitionDirection = 1; this.transitionOffset = 0;
      this.transitionProgressX = 0; this.transitionProgressXScale = 1;
    }
    this.transitionStart = getTimer();
    this.onEnterFrame = this.transitionTick;
    this.electronLevel = newLevel;
  }
  transitionTick() {
    const dt = getTimer() - this.transitionStart;
    const u = dt / AD.transitionTime;
    if (u > 1) {
      this.transitionProgressVisible = false;
      this.e1.alpha = 100; this.e2.alpha = 0;
      if (isFinite(this.newLevel)) this.orbitAlpha[this.newLevel - 1] = AD.occupiedOrbitAlpha;
      if (isFinite(this.oldLevel)) this.orbitAlpha[this.oldLevel - 1] = AD.unoccupiedOrbitAlpha;
      this.onEnterFrame = null;
      this.sim.onAnimationFinished();
    } else {
      this.transitionProgressX = this.transitionOffset + this.transitionDirection *
        ((dt * 0.03) % AD.transitionProgressDotSpacing);
      this.e1.alpha = u * 100;
      this.e2.alpha = 100 - this.e1.alpha;
      const dA = u * AD.orbitAlphaRange;
      if (isFinite(this.newLevel)) this.orbitAlpha[this.newLevel - 1] = AD.unoccupiedOrbitAlpha + dA;
      if (isFinite(this.oldLevel)) this.orbitAlpha[this.oldLevel - 1] = AD.occupiedOrbitAlpha - dA;
      this.transitionProgressAlpha = (u < 0.5) ? 100 : (100 - 200 * (u - 0.5));
    }
  }

  deexciteAtom(energy, newLevel) {
    const mx = this.levelPositions[newLevel - 1] +
      (this.levelPositions[this.electronLevel - 1] - this.levelPositions[newLevel - 1]) / 2;
    const photonStyle = getPhotonStyleFromWavelength(1240 / energy);
    const dx = AD.width / 0.5253219888177297;
    this.photons.addPhoton({ x: mx, y: 0 }, { x: mx + dx, y: -dx }, photonStyle, { wavelength: 124 / energy, amplitude: 8 });
    this.sim.onDeexcitation(energy, this.electronLevel, newLevel);
    this.startElectronTransition(newLevel);
  }

  recaptureElectron(newLevel) {
    let angle = AD.ionizationAngleSpread * (Math.random() - 0.5);
    const d = 5 + 14 + AD.halfHeight / Math.cos(angle);
    if (Math.random() > 0.5) angle += Math.PI / 2; else angle -= Math.PI / 2;
    this.electronEndX = this.levelPositions[newLevel - 1];
    this.electronEndOrbit = newLevel;
    this.electronStartX = this.electronEndX + d * Math.cos(angle);
    this.electronStartY = d * Math.sin(angle);
    this.e1.x = this.electronStartX; this.e1.y = this.electronStartY; this.e1.alpha = 100;
    this.electronAngle = angle + Math.PI;
    this.electronPathLength = d;
    this.electronLevel = newLevel;
    this.recombinationTime = d / AD.recombinationSpeed;
    this.recombinationStart = getTimer();
    this.onEnterFrame = this.recombinationTick;
  }
  recombinationTick() {
    const dt = getTimer() - this.recombinationStart;
    const u = dt / this.recombinationTime;
    if (u > 1) {
      this.e1.x = this.electronEndX; this.e1.y = 0;
      this.orbitAlpha[this.electronEndOrbit - 1] = AD.occupiedOrbitAlpha;
      this.ionizedVisible = false;
      this.onEnterFrame = null;
      this.sim.onAnimationFinished();
      this.sim.onRecombination(this.electronLevel);
    } else {
      this.e1.x = this.electronStartX + u * this.electronPathLength * Math.cos(this.electronAngle);
      this.e1.y = this.electronStartY + u * this.electronPathLength * Math.sin(this.electronAngle);
    }
  }

  ionizeAtom(extraEnergy) {
    const oldLevel = this.electronLevel;
    this.orbitAlpha[this.electronLevel - 1] = AD.unoccupiedOrbitAlpha;
    this.ionizedVisible = true;
    this.electronLevel = Infinity;
    this.electronStartX = this.e1.x; this.electronStartY = this.e1.y;
    this.electronSpeed = AD.minIonizationSpeed + AD.photonSpeed / 1000 * Math.sqrt(extraEnergy / 15);
    this.electronAngle = AD.ionizationAngleSpread * (Math.random() - 0.5);
    if (Math.random() > 0.5) this.electronAngle += Math.PI / 2; else this.electronAngle -= Math.PI / 2;
    this.ionizationStartTime = getTimer();
    this.onEnterFrame = this.ionizationTick;
    this.sim.onIonization(this.photonEnergy, oldLevel);
  }
  ionizationTick() {
    const d = (getTimer() - this.ionizationStartTime) * this.electronSpeed;
    this.e1.x = this.electronStartX + d * Math.cos(this.electronAngle);
    this.e1.y = this.electronStartY + d * Math.sin(this.electronAngle);
    const inside = this.e1.x >= 0 && this.e1.x <= AD.width &&
                   this.e1.y >= -AD.halfHeight && this.e1.y <= AD.halfHeight;
    if (!inside) { this.onEnterFrame = null; this.sim.onAnimationFinished(); }
  }

  noAbsorptionTick() {
    if (getTimer() > this.noAbsorptionTime) {
      this.onEnterFrame = null;
      this.sim.onAnimationFinished();
      this.sim.onNoAbsorption(this.photonEnergy);
    }
  }
  absorptionTick() {
    if (getTimer() > this.absorptionTime) {
      this.onEnterFrame = null;
      if (isFinite(this.newElectronLevel)) {
        this.sim.onExcitation(this.photonEnergy, this.electronLevel, this.newElectronLevel);
        this.startElectronTransition(this.newElectronLevel);
      } else if (this.newElectronLevel === Infinity) {
        this.ionizeAtom(this.extraEnergy);
      }
    }
  }

  firePhoton(energy, newLevel, extraEnergy) {
    this.photonEnergy = energy;
    let xEnd;
    if (newLevel != null) {
      xEnd = this.levelPositions[this.electronLevel - 1];
      this.absorptionTime = getTimer() + 1000 * (AD.width - xEnd) / AD.photonSpeed;
      this.newElectronLevel = newLevel;
      this.extraEnergy = extraEnergy;
      this.onEnterFrame = this.absorptionTick;
    } else {
      xEnd = 0;
      this.noAbsorptionTime = getTimer() + AD.nullAnimationTime;
      this.onEnterFrame = this.noAbsorptionTick;
    }
    const photonStyle = getPhotonStyleFromWavelength(1240 / energy);
    this.photons.addPhoton({ x: AD.width, y: 0 }, { x: xEnd, y: 0 }, photonStyle, { wavelength: 124 / energy, amplitude: 8 });
  }

  tick() {
    if (this.onEnterFrame) this.onEnterFrame.call(this);
    this.photons.tick();
  }
}

class EnergyScale {
  constructor() {
    this.level = 1;
    this.markers = [];
    for (let i = 1; i <= ES.maxLevel; i++) {
      const e = 13.6 / (i * i);
      this.markers.push({
        level: i,
        y: ES.oy + ES.yScale * (13.6 - e),
        levelString: "level " + i,
        energyString: "-" + toFixed(e, 1) + " eV"
      });
    }
    this.ionizedY = ES.oy - ES.ionizationHeight;
  }
  setLevel(level) { this.level = level; }
}

// snapPointsList: transitions n1<=3, n2<=6  (E = 13.6*(1/n1^2 - 1/n2^2)).
function buildSnapPoints() {
  const sPL = [];
  for (let i = 1; i <= EB.maxSnapLevel; i++)
    for (let j = i + 1; j <= EB.maxLevel; j++) {
      const e = 13.6 * (1 / (i * i) - 1 / (j * j));
      sPL.push({ x: EB.scale * e, e: e, n1: i, n2: j });
    }
  return sPL;
}
// init() faint tick marks: n1<=3, n2<=20.
function buildFaintTicks() {
  const t = [];
  for (let i = 1; i <= EB.maxSnapLevel; i++)
    for (let j = i + 1; j <= 20; j++)
      t.push(EB.scale * (13.6 * (1 / (i * i) - 1 / (j * j))));
  return t;
}

class EnergyBar {
  constructor(sim) {
    this.sim = sim;
    this.snapPointsList = buildSnapPoints();
    this.faintTicks = buildFaintTicks();
    this.selectedTransition = null;
    this.grabberX = 177.8;                 // initial design placement
    this.buttonsMasked = false;
    this.moveGrabber(this.grabberX);
  }
  moveGrabber(newX) {
    if (newX < 1) newX = 1; else if (newX > EB.barWidth) newX = EB.barWidth;
    const sPL = this.snapPointsList;
    let dMin = Infinity, iMin = 0;
    for (let i = 0; i < sPL.length; i++) {
      const d = Math.abs(newX - sPL[i].x);
      if (d < dMin) { dMin = d; iMin = i; }
    }
    if (dMin < EB.snapDistance) {
      newX = sPL[iMin].x; this.selectedTransition = iMin;
    } else {
      this.selectedTransition = null;
    }
    this.grabberX = newX;
    const e = this.grabberX / EB.scale;              // E_n axis: x = scale * eV
    const w = 1240 / e;                              // wavelength (nm):  lambda = 1240/E
    const f = 299792458 / (w * 1e-9);                // frequency (Hz):   f = c / lambda
    this.frequency = f;
    this.energyValue = e;
    this.wavelengthNm = w;
    if (w < 100) this.wavelengthString = toFixed(w, 1) + " nm";
    else if (w < 1000) this.wavelengthString = Math.round(w) + " nm";
    else this.wavelengthString = toFixed(w / 1000, 2) + " µm";
    this.energyString = (e >= 1) ? toFixed(e, 1) + " eV" : toFixed(e, 2) + " eV";
  }
  reenable() {
    this.buttonsMasked = false;
  }
  onButtonPressed(id) {
    if (id === 0) { this.firePhoton(); }
    else {
      const curr = this.selectedTransition;
      this.selectedTransition = id - 1;
      this.firePhoton();
      this.selectedTransition = curr;
    }
  }
  firePhoton() {
    this.buttonsMasked = true;
    if (this.selectedTransition != null) {
      const p = this.snapPointsList[this.selectedTransition];
      this.sim.firePhoton(p.e, p.n1, p.n2);
    } else {
      const e = this.grabberX / EB.scale;
      this.sim.firePhoton(e);
    }
  }
}

class LogEntry {
  constructor(entry) {
    this.entry = entry;
    this.build();
  }
  build() {
    const e = this.entry;
    this.descriptor = null;
    this.descriptorName = null;
    if (e.transitionID != null) {
      const t = transitionsTable[e.transitionID];
      this.descriptor = t.letter + greekSub(t.subscript);
      this.descriptorName = seriesName(t.letter) + " " + GREEK_NAME[t.subscript];
    }
    switch (e.type) {
      case "i":
        this.photonEnergy = toFixed(e.energy, 2) + " eV photon";
        this.photonAction = "absorbed"; this.typeText = "ionization";
        this.leftLevel = e.oldLevel; this.rightLevel = ""; this.absorbed = true; break;
      case "e":
        this.photonEnergy = toFixed(e.energy, 2) + " eV photon";
        this.photonAction = "absorbed"; this.typeText = "excitation";
        this.leftLevel = e.oldLevel; this.rightLevel = e.newLevel; this.absorbed = true; break;
      case "r":
        this.typeText = "recombination"; this.leftLevel = e.newLevel; this.rightLevel = "";
        this.noPhoton = true; break;
      case "d":
        this.photonEnergy = toFixed(e.energy, 2) + " eV photon";
        this.photonAction = "emitted"; this.typeText = "deexcitation";
        this.leftLevel = e.newLevel; this.rightLevel = e.oldLevel; this.absorbed = false; break;
      case "n":
        this.photonEnergy = toFixed(e.energy, 2) + " eV photon";
        this.photonAction = "not absorbed"; this.noType = true; break;
    }
  }
}

class LogComponent {
  constructor() {
    this.entries = [];
    this.onAdd = null;
    this.onClear = null;
    this.clearEntries();
  }
  clearEntries() {
    this.entries = [];
    if (this.onClear) this.onClear();
  }
  addEntry(entry) {
    if (entry.type === "f") return;        // "fire" events are not logged
    const le = new LogEntry(entry);
    this.entries.push(le);
    if (this.onAdd) this.onAdd(le);
  }
  tick() { /* DOM log; the color fade is handled in CSS */ }
}

class Simulator {
  constructor() {
    this.standardDecayTime = 2500;
    this.standardRecombinationTime = 2500;
    this.decayTable = [[], [1], [0.5, 0.5], [0.33, 0.33, 0.34], [0.25, 0.25, 0.25, 0.25], [0.2, 0.2, 0.2, 0.2, 0.2]];
    this.recombinationTable = [0.2, 0.2, 0.2, 0.2, 0.1, 0.1];
    this.photonTransitionIDTable = [
      [null],
      [null, null, 0, 1, 2, 3, 4],
      [null, null, null, 5, 6, 7, 8],
      [null, null, null, null, 9, 10, 11],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null]
    ];
    this.electronLevel = 1;
    this.photonIsInQueue = false;
    this.photonTransitionID = null;
    this.onEnterFrame = null;

    this.atomDiagramMC = new AtomDiagram(this);
    this.scaleMC = new EnergyScale();
    this.logMC = new LogComponent();
    this.sliderMC = new EnergyBar(this);
  }

  onElectronDraggingStart() { this.onEnterFrame = null; this.photonIsInQueue = false; this.clearLog(); }
  onElectronDragged(level) { this.electronLevel = level; this.scaleMC.setLevel(level); }
  onElectronDraggingEnd() { this.onAnimationFinished(); }

  recombinationTick() {
    if (getTimer() > this.waitTime) {
      this.atomDiagramMC.recaptureElectron(this.newElectronLevel);
      this.electronLevel = this.newElectronLevel;
      this.onEnterFrame = null;
    }
  }
  decayTick() {
    if (getTimer() > this.waitTime) {
      const nL = this.newElectronLevel;
      // E = 13.6 * (1/nL^2 - 1/n^2)  -- emitted photon energy
      const energy = 13.6 * (1 / (nL * nL) - 1 / (this.electronLevel * this.electronLevel));
      this.photonTransitionID = this.photonTransitionIDTable[nL][this.electronLevel];
      this.atomDiagramMC.deexciteAtom(energy, nL);
      this.electronLevel = nL;
      this.onEnterFrame = null;
    }
  }
  onAnimationFinished() {
    if (this.photonIsInQueue) {
      const p = this.queuedPhotonParameters;
      this.firePhoton(p.energy, p.level1, p.level2);
      this.photonIsInQueue = false;
    } else {
      if (this.onEnterFrame == null) {
        if (this.electronLevel === Infinity) {
          const dT = this.recombinationTable;
          const pr = Math.random(); let ps = 0, i = 0;
          while (i < dT.length) { ps += dT[i]; if (pr < ps) break; i++; }
          if (i >= dT.length) i = dT.length - 1;
          this.newElectronLevel = i + 1;
          this.waitTime = getTimer() + this.standardRecombinationTime;
          this.onEnterFrame = this.recombinationTick;
        } else if (this.electronLevel > 1) {
          const dT = this.decayTable[this.electronLevel - 1];
          const pr = Math.random(); let ps = 0, i = 0;
          while (i < dT.length) { ps += dT[i]; if (pr < ps) break; i++; }
          if (i >= dT.length) i = dT.length - 1;
          this.newElectronLevel = i + 1;
          this.waitTime = getTimer() + this.standardDecayTime;
          this.onEnterFrame = this.decayTick;
        }
      }
      this.sliderMC.reenable();
    }
  }

  clearLog() { this.logMC.clearEntries(); }
  onRecombination(newLevel) { this.logMC.addEntry({ type: "r", newLevel }); this.scaleMC.setLevel(newLevel); }
  onIonization(energy, oldLevel) {
    this.logMC.addEntry({ type: "i", energy, transitionID: this.photonTransitionID, oldLevel });
    this.scaleMC.setLevel(Infinity);
  }
  onExcitation(energy, oldLevel, newLevel) {
    this.logMC.addEntry({ type: "e", energy, transitionID: this.photonTransitionID, oldLevel, newLevel });
    this.scaleMC.setLevel(newLevel);
  }
  onDeexcitation(energy, oldLevel, newLevel) {
    this.logMC.addEntry({ type: "d", energy, transitionID: this.photonTransitionID, oldLevel, newLevel });
    this.scaleMC.setLevel(newLevel);
  }
  onNoAbsorption(energy) {
    this.logMC.addEntry({ type: "n", energy, transitionID: this.photonTransitionID });
  }

  firePhoton(energy, level1, level2) {
    if (this.atomDiagramMC.animationIsInProgress) {
      this.photonIsInQueue = true;
      this.queuedPhotonParameters = { energy, level1, level2 };
    } else {
      this.logMC.addEntry({ type: "f" });
      const ionizationEnergy = 13.6 / (this.electronLevel * this.electronLevel);  // 13.6/n^2
      if (level1 !== undefined) this.photonTransitionID = this.photonTransitionIDTable[level1][level2];
      else this.photonTransitionID = null;

      if (level1 === this.electronLevel) {
        this.electronLevel = level2;
        this.atomDiagramMC.firePhoton(energy, level2);
        this.onEnterFrame = null;
      } else if (isFinite(this.electronLevel) && energy > ionizationEnergy) {
        this.electronLevel = Infinity;
        const extraEnergy = energy - ionizationEnergy;
        this.atomDiagramMC.firePhoton(energy, Infinity, extraEnergy);
        this.onEnterFrame = null;
      } else {
        this.atomDiagramMC.firePhoton(energy, null);
        if (isFinite(this.electronLevel))
          this.waitTime = getTimer() + this.standardDecayTime + this.atomDiagramMC.nullAnimationTime;
        else
          this.waitTime = getTimer() + this.standardRecombinationTime + this.atomDiagramMC.nullAnimationTime;
      }
    }
  }

  tick() {
    if (this.onEnterFrame) this.onEnterFrame.call(this);
    this.atomDiagramMC.tick();
    this.logMC.tick();
  }
}

function seriesName(letter) {
  return letter === "L" ? "Lyman" : letter === "H" ? "Balmer" : letter === "P" ? "Paschen" : letter;
}

/* ===========================================================================
 * SECTION 5 -- PRESENTATION + CONTROLLER (KL-UNL HTML, native controls, a11y)
 *   - Atom Diagram: <canvas> (code-drawn dynamic art).
 *   - Energy Level Diagram + Photon scales: crisp inline SVG drawn here.
 *   - All numbers/equations: LaTeX through the foundation klunlShowEquation,
 *     typeset by the locally-vendored MathJax (SVG output).
 * ========================================================================== */
(function () {
  const sim = new Simulator();
  const INITIAL_GRABBER_X = 177.8;

  const atomCanvas = document.getElementById("atom-canvas");
  const atomCtx = atomCanvas.getContext("2d");
  const photonBars = document.getElementById("photon-bars");
  const scaleDiagram = document.getElementById("scale-diagram");

  const photonRange  = document.getElementById("photon-range");
  const electronSelect = document.getElementById("electron-select");
  const fireBtn      = document.getElementById("fire-btn");
  const clearLogBtn  = document.getElementById("clear-log-btn");
  const pauseBtn     = document.getElementById("pause-btn");
  const logList      = document.getElementById("log-list");
  const logEmpty     = document.getElementById("log-empty");
  const atomDesc     = document.getElementById("atom-desc");
  const scaleDesc    = document.getElementById("scale-desc");
  const photonDesc   = document.getElementById("photon-desc");
  const srStatus     = document.getElementById("sr-status");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false;
  let electronDragging = false;

  /* ----- reduced motion: collapse the visual tweens to near-instant ----- */
  const FULL = {
    transitionTime: AD.transitionTime, photonSpeed: AD.photonSpeed,
    nullAnimationTime: AD.nullAnimationTime, recombinationSpeed: AD.recombinationSpeed,
    minIonizationSpeed: AD.minIonizationSpeed
  };
  function applyMotionPrefs() {
    if (reduceMotion.matches) {
      AD.transitionTime = 1; AD.photonSpeed = 100000; AD.nullAnimationTime = 1;
      AD.recombinationSpeed = 1000; AD.minIonizationSpeed = 1000;
    } else {
      AD.transitionTime = FULL.transitionTime; AD.photonSpeed = FULL.photonSpeed;
      AD.nullAnimationTime = FULL.nullAnimationTime; AD.recombinationSpeed = FULL.recombinationSpeed;
      AD.minIonizationSpeed = FULL.minIonizationSpeed;
    }
  }
  applyMotionPrefs();
  reduceMotion.addEventListener("change", applyMotionPrefs);

  /* =========================================================================
   * 5a -- ATOM DIAGRAM canvas (the only code-drawn dynamic art)
   * ======================================================================= */
  function beginCanvas(g, canvas) {
    const dpr = window.devicePixelRatio || 1;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function setA(g, a) { g.globalAlpha = Math.max(0, Math.min(1, a / 100)); }
  function drawRadial(g, x, y, r, c0, c1, gx, gy) {
    const grad = g.createRadialGradient(x + gx, y + gy, 0, x, y, r * 1.25);
    grad.addColorStop(0, c0); grad.addColorStop(1, c1);
    g.fillStyle = grad; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill();
  }
  function drawDot(g, x, y, dir) {
    g.beginPath();
    if (dir >= 0) { g.moveTo(x - 4, y - 4.3); g.lineTo(x - 1.2, y - 4.3); g.lineTo(x + 3.95, y);
                    g.lineTo(x - 1.2, y + 4.35); g.lineTo(x - 4, y + 4.35); g.lineTo(x + 1.15, y); }
    else { g.moveTo(x + 4, y - 4.3); g.lineTo(x + 1.2, y - 4.3); g.lineTo(x - 3.95, y);
           g.lineTo(x + 1.2, y + 4.35); g.lineTo(x + 4, y + 4.35); g.lineTo(x - 1.15, y); }
    g.closePath(); g.fill();
  }
  function drawPlus(g, x, y) {
    g.beginPath();
    g.moveTo(x + 1.3, y - 7.35); g.lineTo(x + 1.3, y + 1.2); g.lineTo(x - 1.3, y + 1.2);
    g.lineTo(x - 1.3, y - 7.35); g.lineTo(x - 9.8, y - 7.35); g.lineTo(x - 9.8, y - 9.85);
    g.lineTo(x - 1.3, y - 9.85); g.lineTo(x - 1.3, y - 18.35); g.lineTo(x + 1.3, y - 18.35);
    g.lineTo(x + 1.3, y - 9.85); g.lineTo(x + 9.8, y - 9.85); g.lineTo(x + 9.8, y - 7.35);
    g.closePath(); g.fill();
  }
  function renderAtom() {
    const g = atomCtx, ad = sim.atomDiagramMC;
    beginCanvas(g, atomCanvas);
    g.translate(-AD.boxL, -AD.boxT);
    g.globalAlpha = 1;
    g.fillStyle = "#000000";
    g.fillRect(AD.boxL, AD.boxT, AD.boxW, AD.boxH);
    g.save();
    g.beginPath(); g.rect(AD.boxL, AD.boxT, AD.width, AD.boxH); g.clip();
    const cx = AD.ox, cy = AD.cy;
    for (let i = 0; i < AD.levelPositions.length; i++) {
      setA(g, ad.orbitAlpha[i]);
      g.strokeStyle = "#ffffff"; g.lineWidth = 2;
      g.beginPath(); g.arc(cx, cy, AD.levelPositions[i], 0, 2 * Math.PI); g.stroke();
    }
    g.globalAlpha = 1;
    if (ad.transitionProgressVisible) {
      setA(g, ad.transitionProgressAlpha);
      const x0 = Math.min(ad.transitionProgressMaskX0, ad.transitionProgressMaskX1);
      const x1 = Math.max(ad.transitionProgressMaskX0, ad.transitionProgressMaskX1);
      g.save();
      g.beginPath(); g.rect(cx + x0, cy - 10, x1 - x0, 20); g.clip();
      const dx = AD.transitionProgressDotSpacing;
      g.fillStyle = "rgba(228,228,228,0.5)";
      for (let i = -2; i < 2 + Math.ceil(AD.width / dx); i++) {
        const px = cx + ad.transitionProgressX + i * dx * (ad.transitionProgressXScale || 1);
        drawDot(g, px, cy, ad.transitionProgressXScale || 1);
      }
      g.restore(); g.globalAlpha = 1;
    }
    ad.photons.draw(g, cx, cy);
    drawRadial(g, cx, cy, 14, "#f30101", "#9e0101", 3.95, -5.05);
    if (ad.e2.alpha > 0) { setA(g, ad.e2.alpha); drawRadial(g, cx + ad.e2.x, cy + ad.e2.y, 7, "#02d702", "#017801", 2.0, -2.5); }
    if (ad.e1.alpha > 0) { setA(g, ad.e1.alpha); drawRadial(g, cx + ad.e1.x, cy + ad.e1.y, 7, "#02d702", "#017801", 2.0, -2.5); }
    g.globalAlpha = 1; g.restore();
    if (ad.ionizedVisible) {
      g.fillStyle = "#cccccc";
      drawPlus(g, AD.ionizedX, AD.ionizedY);
      g.font = "12px Verdana, sans-serif"; g.textAlign = "left"; g.textBaseline = "top";
      g.fillText("atom is", AD.ionizedX - 9, AD.ionizedY + 18);
      g.fillText("ionized", AD.ionizedX - 9, AD.ionizedY + 32);
    }
  }

  /* =========================================================================
   * 5b -- PHOTON SCALES as positioned HTML with MathJax tick labels.
   *   Three horizontal bars on a shared energy axis (0..15 eV); one red marker
   *   shows the current photon on all three. Pure %-based positioning so the
   *   bars reflow responsively; tick labels are typeset by MathJax.
   * ======================================================================= */
  // shared diagram colors (also used by the energy-level SVG below)
  const FG = "#1a1a1a", MUTED = "#555555", MARK = "#c1272d";
  function eVfromFreq(f) { return 1240 * f / 299792458e9; }
  function eVfromWavelength(nm) { return 1240 / nm; }
  // energy (eV) -> percent across the track (2% inset so end labels fit)
  function pct(ev) { const e = Math.max(0, Math.min(15, ev)); return (2 + (e / 15) * 96).toFixed(2); }
  function barTick(ev) { return `<span class="sim-bar__tick" style="left:${pct(ev)}%"></span>`; }
  // every label is centered on its tick and bottom-aligned with the rest (see CSS)
  function barLabel(ev, latex) {
    return `<span class="sim-bar__label" style="left:${pct(ev)}%">${latex}</span>`;
  }
  function barMarker(k) {
    return `<span class="sim-bar__marker" id="m-${k}" style="left:${pct(INITIAL_GRABBER_X / EB.scale)}%">` +
           `<span class="sim-bar__mtri"></span></span>`;
  }
  function buildPhotonBars() {
    const visL = parseFloat(pct(eVfromWavelength(700)));
    const visR = parseFloat(pct(eVfromWavelength(380)));
    const visMid = pct((eVfromWavelength(700) + eVfromWavelength(380)) / 2);

    const freqRow =
      `<div class="sim-bar"><div class="sim-bar__name">frequency (Hz)</div>` +
        `<div class="sim-bar__track">` +
          `<div class="sim-bar__line"></div>` +
          barTick(eVfromFreq(1e14)) + barTick(eVfromFreq(1e15)) + barTick(eVfromFreq(2e15)) + barTick(eVfromFreq(3e15)) +
          barLabel(eVfromFreq(1e14), `\\(10^{14}\\)`) +
          barLabel(eVfromFreq(1e15), `\\(10^{15}\\)`) +
          barLabel(eVfromFreq(2e15), `\\(2\\times 10^{15}\\)`) +
          barLabel(eVfromFreq(3e15), `\\(3\\times 10^{15}\\)`) +
          barMarker('freq') +
        `</div></div>`;

    const waveRow =
      `<div class="sim-bar"><div class="sim-bar__name">wavelength</div>` +
        `<div class="sim-bar__track">` +
          `<div class="sim-bar__line"></div>` +
          barTick(eVfromWavelength(10000)) + barTick(eVfromWavelength(1000)) + barTick(eVfromWavelength(500)) +
          barTick(eVfromWavelength(200)) + barTick(eVfromWavelength(100)) +
          barLabel(eVfromWavelength(10000), `\\(10\\,\\mu\\text{m}\\)`) +
          barLabel(eVfromWavelength(1000), `\\(1\\,\\mu\\text{m}\\)`) +
          barLabel(eVfromWavelength(500), `\\(500\\,\\text{nm}\\)`) +
          barLabel(eVfromWavelength(200), `\\(200\\,\\text{nm}\\)`) +
          barLabel(eVfromWavelength(100), `\\(100\\,\\text{nm}\\)`) +
          barMarker('wave') +
        `</div></div>`;

    const energyRow =
      `<div class="sim-bar"><div class="sim-bar__name">energy (eV)</div>` +
        `<div class="sim-bar__track">` +
          `<div class="sim-bar__line"></div>` +
          barTick(0) + barTick(5) + barTick(10) + barTick(15) +
          barLabel(0, `\\(0\\)`) + barLabel(5, `\\(5\\)`) +
          barLabel(10, `\\(10\\)`) + barLabel(15, `\\(15\\)`) +
          barMarker('energy') +
        `</div></div>`;

    // EM-spectrum legend (colored visible band + region names), shown on its own
    // strip below the energy bar and centered before the Photon energy controls.
    const spectrumStrip =
      `<div class="sim-bar sim-spectrum">` +
        `<div class="sim-bar__track sim-spectrum__track">` +
          `<div class="sim-bar__band" style="left:${visL.toFixed(2)}%;width:${(visR - visL).toFixed(2)}%"></div>` +
          `<span class="sim-bar__region" style="left:${pct(0.6)}%">infrared</span>` +
          `<span class="sim-bar__region" style="left:${visMid}%">visible</span>` +
          `<span class="sim-bar__region" style="left:${pct(8)}%">ultraviolet</span>` +
        `</div></div>`;

    photonBars.innerHTML = `<div class="sim-bars-inner">${freqRow}${waveRow}${energyRow}${spectrumStrip}</div>`;
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([photonBars]).catch(function () {});
    }
  }
  function positionPhotonMarkers() {
    const p = pct(sim.sliderMC.grabberX / EB.scale) + "%";
    for (const k of ["freq", "wave", "energy"]) {
      const el = document.getElementById("m-" + k);
      if (el) el.style.left = p;
    }
  }

  /* =========================================================================
   * 5c -- ENERGY LEVEL DIAGRAM drawn as crisp SVG (high contrast).
   *   Level lines are placed TO SCALE at E_n = -13.6/n^2 eV, so the 0 eV ionization
   *   limit sits proportionally just above the bunched upper levels (n>=3). As in
   *   the original, the crowding is handled by labelling ONLY the current level
   *   (the "n=N" / energy label moves to whichever level the electron is on); the
   *   other levels are plain tick lines.
   * ======================================================================= */
  function renderScaleDiagram() {
    const level = sim.scaleMC.level;          // 1..6, or Infinity when ionized
    const W = 300, H = 430, xL = 96, xR = 204;
    const top = 54, bot = 410;
    const yForMag = mag => top + (mag / 13.6) * (bot - top);  // |E| in eV; 0->top, 13.6->bot
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="sim-svg" preserveAspectRatio="xMidYMid meet">`;
    // ionization limit (E = 0) -- to scale, just above the upper levels
    s += `<line x1="${xL}" y1="${top}" x2="${xR}" y2="${top}" stroke="${MUTED}" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    s += `<text x="${xR + 8}" y="${top + 4}" font-size="13" fill="${MUTED}">0 eV</text>`;
    s += `<text x="${(xL + xR) / 2}" y="${top - 10}" font-size="12.5" fill="${MUTED}" text-anchor="middle">ionization limit</text>`;
    // ionized state: red marker above the ionization limit
    if (!isFinite(level)) {
      s += `<polygon points="${xL + 30},${top - 24} ${xR - 30},${top - 24} ${(xL + xR) / 2},${top - 15}" fill="${MARK}"/>`;
      s += `<text x="${(xL + xR) / 2}" y="${top - 28}" font-size="13" fill="${MARK}" text-anchor="middle" font-weight="700">ionized (E &gt; 0)</text>`;
    }
    // level lines n = 1..6 to scale; only the CURRENT level is labelled
    for (let n = 1; n <= 6; n++) {
      const mag = 13.6 / (n * n);             // |E_n|
      const y = yForMag(mag);
      const cur = isFinite(level) && level === n;
      s += `<line x1="${xL}" y1="${y.toFixed(1)}" x2="${xR}" y2="${y.toFixed(1)}" ` +
           `stroke="${cur ? MARK : "#555555"}" stroke-width="${cur ? 5 : 1.6}"/>`;
      if (cur) {
        s += `<text x="${xL - 9}" y="${(y + 4.5).toFixed(1)}" font-size="14" text-anchor="end" fill="${MARK}" font-weight="700">n=${n}</text>`;
        s += `<text x="${xR + 9}" y="${(y + 4.5).toFixed(1)}" font-size="13" fill="${MARK}" font-weight="700">−${toFixed(mag, 1)} eV</text>`;
      }
    }
    s += `</svg>`;
    scaleDiagram.innerHTML = s;
  }

  /* =========================================================================
   * 5d -- LaTeX equation builders (typeset by MathJax via klunlShowEquation)
   * ======================================================================= */
  function freqLatex(coeff, exp) { return `\\( f = ${coeff} \\times 10^{${exp}}\\ \\text{Hz} \\)`; }
  function energyLatex(v) { return `\\( E = ${v}\\ \\text{eV} \\)`; }
  function waveLatex() {
    const w = sim.sliderMC.wavelengthNm;
    if (w < 100) return `\\( \\lambda = ${toFixed(w, 1)}\\ \\text{nm} \\)`;
    if (w < 1000) return `\\( \\lambda = ${Math.round(w)}\\ \\text{nm} \\)`;
    return `\\( \\lambda = ${toFixed(w / 1000, 2)}\\ \\mu\\text{m} \\)`;
  }
  function levelEnergyLatex(level) {
    if (!isFinite(level)) return `\\( E > 0\\ \\text{(ionized)} \\)`;
    const e = 13.6 / (level * level);
    return `\\( E_{${level}} = -\\dfrac{13.6}{${level}^{2}} = -${toFixed(e, 1)}\\ \\text{eV} \\)`;
  }

  /* =========================================================================
   * 5e -- readouts / equations / live regions
   * ======================================================================= */
  // Spoken-form helpers. Screen readers skip or mis-read unit symbols (eV, nm,
  // µm, Hz) and the minus glyph, so EVERY spoken string (.sr-only / aria-valuetext
  // / aria-label / live region) is built with unit WORDS and an explicit "minus".
  // The visible MathJax readouts, axis labels, and log keep the symbols unchanged.
  function spokenEnergyEV(eV, digits) {
    const d = (digits == null) ? (eV >= 1 ? 1 : 2) : digits;
    return toFixed(eV, d) + " electron volts";
  }
  function spokenWavelength() {
    const w = sim.sliderMC.wavelengthNm;
    if (w < 100)  return toFixed(w, 1) + " nanometers";
    if (w < 1000) return Math.round(w) + " nanometers";
    return toFixed(w / 1000, 2) + " micrometers";
  }
  function spokenFrequency(sn) {
    return sn.coefficient + " times ten to the " + sn.exponent + " hertz";
  }
  function updatePhotonReadouts() {
    const eb = sim.sliderMC;
    const sn = sciNotation(eb.frequency, 2);
    klunlShowEquation(["freq-eqn", freqLatex(sn.coefficient, sn.exponent)],
      ["freq-sr", "Frequency " + sn.coefficient + " times ten to the " + sn.exponent + " hertz"]);
    klunlShowEquation(["wave-eqn", waveLatex()], ["wave-sr", "Wavelength " + spokenWavelength()]);
    const eStr = (eb.energyValue >= 1) ? toFixed(eb.energyValue, 1) : toFixed(eb.energyValue, 2);
    klunlShowEquation(["energy-eqn", energyLatex(eStr)], ["energy-sr", "Energy " + eStr + " electron volts"]);
    positionPhotonMarkers();
    // Each spoken component carries its quantity name + value + word unit.
    let vt = "Energy " + spokenEnergyEV(eb.energyValue) + ", wavelength " + spokenWavelength() +
             ", frequency " + spokenFrequency(sn);
    if (eb.selectedTransition != null) {
      const p = eb.snapPointsList[eb.selectedTransition];
      const tid = sim.photonTransitionIDTable[p.n1][p.n2];
      if (tid != null) {
        const t = transitionsTable[tid];
        vt = seriesName(t.letter) + " " + GREEK_NAME[t.subscript] +
             " transition (level " + p.n1 + " to level " + p.n2 + "). " + vt;
      }
    }
    photonRange.setAttribute("aria-valuetext", vt);
    // Keep the photon-scales describedby text current (read when navigating to the
    // bars). Not a live region, so updating it per step does not flood announcements.
    photonDesc.textContent = "Selected photon: energy " + spokenEnergyEV(eb.energyValue) +
      ", wavelength " + spokenWavelength() + ", frequency " + spokenFrequency(sn) + ".";
  }
  function updateLevelUI() {
    renderScaleDiagram();
    const lvl = sim.scaleMC.level;
    let sr;
    if (!isFinite(lvl)) sr = "The atom is ionized; the electron's energy is greater than zero.";
    else {
      const e = 13.6 / (lvl * lvl);
      sr = "Energy of level " + lvl + " equals minus 13.6 over " + lvl + " squared, equals minus " +
        toFixed(e, 1) + " electron volts.";
    }
    klunlShowEquation(["energy-level-eqn", levelEnergyLatex(lvl)], ["energy-level-sr", sr]);
    refreshStateDescriptions();
  }
  function levelStateText() {
    const lvl = sim.scaleMC.level;
    if (!isFinite(lvl)) return "The atom is ionized (the electron has been ejected).";
    const e = 13.6 / (lvl * lvl);
    return "The electron is on level " + lvl + ", energy minus " + toFixed(e, 1) + " electron volts.";
  }
  function refreshStateDescriptions() {
    atomDesc.textContent = levelStateText();
    scaleDesc.textContent = levelStateText();
  }

  /* =========================================================================
   * 5f -- event log -> DOM (high contrast; aria-live announcement per event)
   * ======================================================================= */
  // transition as LaTeX, e.g. \(1 \to 2\), \(1 \to \infty\), \(\infty \to 3\)
  function transitionLatexArrow(le) {
    const e = le.entry;
    let from = null, to = null;
    if (e.type === "e" || e.type === "d") { from = e.oldLevel; to = e.newLevel; }
    else if (e.type === "i") { from = e.oldLevel; to = "\\infty"; }
    else if (e.type === "r") { from = "\\infty"; to = e.newLevel; }
    if (from === null) return "";
    return `\\(${from} \\to ${to}\\)`;
  }
  function renderLogEntry(le) {
    logEmpty.hidden = true;
    const e = le.entry;
    const li = document.createElement("li");
    li.className = "sim-log__entry";
    if (!reduceMotion.matches) {
      li.classList.add("sim-log__entry--new");
      requestAnimationFrame(() => requestAnimationFrame(() => li.classList.remove("sim-log__entry--new")));
    }
    let photonHtml = "";
    if (!le.noPhoton) {
      let descHtml = "";
      if (le.descriptor && e.transitionID != null) {
        const t = transitionsTable[e.transitionID];
        descHtml = " (" + transitionLatex(t.letter, t.subscript) + ")";
      }
      // energy value + unit as MathJax, then the literal word "photon"
      photonHtml =
        `<span class="sim-log__energy">\\(${toFixed(e.energy, 2)}\\ \\text{eV}\\) photon</span>` +
        `<span class="sim-log__action">${le.photonAction}${descHtml}</span>`;
    }
    // Visible columns (MathJax energy/transition with symbol units) are hidden from
    // the accessibility tree; an .sr-only companion carries the word-unit sentence so
    // browsing the log reads clean prose. (.sr-only is out of flow, so the 3-column
    // grid layout is unaffected.)
    li.innerHTML =
      `<span class="sim-log__type" aria-hidden="true">${le.noType ? "" : le.typeText}</span>` +
      `<span class="sim-log__transition" aria-hidden="true">${transitionLatexArrow(le)}</span>` +
      `<span class="sim-log__photon" aria-hidden="true">${photonHtml}</span>` +
      `<span class="sr-only">${eventMessage(le)}</span>`;
    logList.appendChild(li);
    logList.scrollTop = logList.scrollHeight;
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([li]).then(function () {
        logList.scrollTop = logList.scrollHeight;
      }).catch(function () {});
    }
    announceEvent(le);
  }
  // Units-complete prose for one log event. Used both for the live announcement
  // (#sr-status) and as each log entry's .sr-only companion, so browsing the log
  // by keyboard reads the same word-unit sentence (the visible MathJax columns are
  // aria-hidden). "eV" -> "electron volt(s)" so the unit is actually spoken.
  function eventMessage(le) {
    const e = le.entry;
    const desc = le.descriptor ? " (" + le.descriptorName + ")" : "";
    const photon = (e.energy != null) ? toFixed(e.energy, 2) + " electron volt photon" : "photon";
    switch (e.type) {
      case "e": return "Excitation. " + photon + " absorbed" + desc + ". Electron moved from level " + e.oldLevel + " to level " + e.newLevel + ".";
      case "d": return "Deexcitation. " + photon + " emitted" + desc + ". Electron moved from level " + e.oldLevel + " to level " + e.newLevel + ".";
      case "i": return "Ionization. " + photon + " absorbed" + desc + ". Electron ejected from level " + e.oldLevel + "; the atom is now ionized.";
      case "r": return "Recombination. Electron recaptured into level " + e.newLevel + ". The atom is no longer ionized.";
      case "n": return photon + " not absorbed; it passed through the atom.";
    }
    return "";
  }
  function announceEvent(le) { srStatus.textContent = eventMessage(le); }
  sim.logMC.onAdd = renderLogEntry;
  sim.logMC.onClear = function () { logList.innerHTML = ""; logEmpty.hidden = false; };

  /* =========================================================================
   * 5g -- preset transition buttons, positioned along the energy axis.
   *   Each button sits at its transition's energy (so it lines up with the bars
   *   and slider) and is staggered into one of two rows to stay clickable -- the
   *   placement (grabber-coordinate x in [0,584], and row) is taken from the
   *   original Flash button layout. x -> percent: 2 + lx/584*96 (same mapping the
   *   bar markers use, so a button lines up with its marker).
   * ======================================================================= */
  // x positions from the original Flash button layout; rows chosen so adjacent
  // buttons (especially the converging Lyman lines) alternate rows and don't collide.
  const PRESET_POS = {
    1:  { lx: 397.1, row: 0 }, 2:  { lx: 461.6, row: 0 }, 3:  { lx: 491.1, row: 1 },
    4:  { lx: 507.0, row: 0 }, 5:  { lx: 525.1, row: 1 }, 6:  { lx: 74.0,  row: 1 },
    7:  { lx: 94.0,  row: 0 }, 8:  { lx: 111.1, row: 1 }, 9:  { lx: 128.1, row: 0 },
    10: { lx: 20.0,  row: 0 }, 11: { lx: 37.1,  row: 1 }, 12: { lx: 55.1,  row: 0 }
  };
  const presetButtons = [];
  function buildPresetButtons() {
    const axis = document.getElementById("preset-axis");
    for (let id = 1; id <= 12; id++) {
      const t = transitionsTable[id - 1];
      const p = sim.sliderMC.snapPointsList[id - 1];
      const pos = PRESET_POS[id];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "button sim-btn sim-preset";
      btn.style.left = (2 + pos.lx / 584 * 96).toFixed(2) + "%";
      btn.style.top = (pos.row * 2.35).toFixed(2) + "rem";
      btn.innerHTML = transitionLatex(t.letter, t.subscript);   // MathJax label, e.g. L-alpha
      // aria-label gives screen readers the plain-language name (MathJax is decorative here)
      btn.setAttribute("aria-label", seriesName(t.letter) + " " + GREEK_NAME[t.subscript] +
        " transition, level " + p.n1 + " to level " + p.n2 + ", " + toFixed(p.e, 2) + " electron volts");
      btn.addEventListener("click", () => { if (!sim.sliderMC.buttonsMasked) sim.sliderMC.onButtonPressed(id); });
      presetButtons.push(btn);
      axis.appendChild(btn);
    }
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise(presetButtons).catch(function () {});
    }
  }

  /* =========================================================================
   * 5h -- photon energy slider (native, fully keyboard-operable)
   * ======================================================================= */
  photonRange.addEventListener("input", () => {
    sim.sliderMC.moveGrabber(parseFloat(photonRange.value));
    photonRange.value = String(Math.round(sim.sliderMC.grabberX));
    updatePhotonReadouts();
  });
  // (Photon selection is spoken by the slider's own aria-valuetext on each step;
  //  #photon-desc is kept current inside updatePhotonReadouts as a describedby target.)

  /* =========================================================================
   * 5i -- "move the electron" demonstration (dropdown + canvas drag)
   * ======================================================================= */
  function moveElectronTo(level) {
    const ad = sim.atomDiagramMC;
    if (!electronDragging) { electronDragging = true; sim.onElectronDraggingStart(); ad.draggingStart(); }
    const oldLevel = sim.electronLevel;
    ad.e1.x = ad.levelPositions[level - 1]; ad.e2.x = ad.e1.x; ad.e1.y = 0; ad.e2.y = 0;
    sim.electronLevel = level;
    ad.electronLevel = level;   // keep the Atom Diagram's own level in sync (used by
                                // deexciteAtom for the log + animation, else the first
                                // de-excitation reads a stale level and shows "1 -> x")
    sim.onElectronDragged(level);
    ad.orbitAlpha[level - 1] = AD.occupiedOrbitAlpha;
    if (level !== oldLevel && isFinite(oldLevel)) ad.orbitAlpha[oldLevel - 1] = AD.unoccupiedOrbitAlpha;
    updateLevelUI();
  }
  function endElectronMove() {
    if (!electronDragging) return;
    electronDragging = false;
    sim.atomDiagramMC.draggingEnd();
    sim.onElectronDraggingEnd();
    refreshStateDescriptions();
  }
  electronSelect.addEventListener("change", () => {
    const lvl = parseInt(electronSelect.value, 10);
    moveElectronTo(lvl);
    endElectronMove();
    srStatus.textContent = "Electron moved to level " + lvl + ". " + levelStateText();
  });

  function atomStageCoords(ev) {
    const rect = atomCanvas.getBoundingClientRect();
    const sx = AD.boxW / rect.width, sy = AD.boxH / rect.height;
    return { x: (ev.clientX - rect.left) * sx + AD.boxL, y: (ev.clientY - rect.top) * sy + AD.boxT };
  }
  let electronPointerDrag = false, electronOffset = 0;
  function hitElectron(p) {
    const ad = sim.atomDiagramMC;
    return Math.hypot(p.x - (AD.ox + ad.e1.x), p.y - (AD.cy + ad.e1.y)) <= 12;
  }
  atomCanvas.addEventListener("pointerdown", (ev) => {
    const p = atomStageCoords(ev);
    if (!hitElectron(p)) return;
    electronPointerDrag = true;
    electronOffset = (p.x - AD.ox) - sim.atomDiagramMC.e1.x;
    atomCanvas.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  });
  atomCanvas.addEventListener("pointermove", (ev) => {
    if (!electronPointerDrag) return;
    const p = atomStageCoords(ev);
    const xm = (p.x - AD.ox) - electronOffset;
    let minD = Infinity, newLevel = 1;
    for (let i = 0; i < AD.levelPositions.length; i++) {
      const d = Math.abs(xm - AD.levelPositions[i]);
      if (d < minD) { minD = d; newLevel = i + 1; }
    }
    moveElectronTo(newLevel);
    electronSelect.value = String(newLevel);
    ev.preventDefault();
  });
  function endPointerDrag(ev) {
    if (!electronPointerDrag) return;
    electronPointerDrag = false;
    try { atomCanvas.releasePointerCapture(ev.pointerId); } catch (_) {}
    endElectronMove();
    srStatus.textContent = "Electron moved to level " + sim.electronLevel + ". " + levelStateText();
  }
  atomCanvas.addEventListener("pointerup", endPointerDrag);
  atomCanvas.addEventListener("pointercancel", endPointerDrag);

  /* =========================================================================
   * 5j -- fire / clear / pause / reset
   * ======================================================================= */
  fireBtn.addEventListener("click", () => { if (!sim.sliderMC.buttonsMasked) sim.sliderMC.onButtonPressed(0); });
  clearLogBtn.addEventListener("click", () => { sim.clearLog(); srStatus.textContent = "Event log cleared."; });
  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.setAttribute("aria-pressed", String(paused));
    pauseBtn.textContent = paused ? "Resume animation" : "Pause animation";
    srStatus.textContent = paused ? "Animation paused." : "Animation resumed.";
  });

  function syncControlAvailability() {
    const masked = sim.sliderMC.buttonsMasked;
    fireBtn.disabled = masked;
    for (const b of presetButtons) b.disabled = masked;
    if (!electronDragging && !electronPointerDrag) {
      const lvl = sim.scaleMC.level;
      if (isFinite(lvl) && document.activeElement !== electronSelect) electronSelect.value = String(lvl);
    }
  }

  let lastScaleLevel = 1;
  document.addEventListener("sim-reset", resetSim);
  function resetSim() {
    sim.onEnterFrame = null; sim.photonIsInQueue = false; sim.photonTransitionID = null;
    sim.electronLevel = 1;
    const ad = sim.atomDiagramMC;
    ad.onEnterFrame = null; ad.electronLevel = 1;
    ad.orbitAlpha = [AD.occupiedOrbitAlpha, AD.unoccupiedOrbitAlpha, AD.unoccupiedOrbitAlpha,
                     AD.unoccupiedOrbitAlpha, AD.unoccupiedOrbitAlpha, AD.unoccupiedOrbitAlpha];
    ad.e1 = { x: AD.levelPositions[0], y: 0, alpha: 100 };
    ad.e2 = { x: 0, y: 0, alpha: 0 };
    ad.ionizedVisible = false; ad.transitionProgressVisible = false;
    ad.photons = new StreamingPhotons();
    sim.scaleMC.setLevel(1);
    sim.sliderMC.selectedTransition = null; sim.sliderMC.buttonsMasked = false;
    sim.sliderMC.moveGrabber(INITIAL_GRABBER_X);
    sim.clearLog();
    electronDragging = false; electronPointerDrag = false;
    photonRange.value = String(Math.round(sim.sliderMC.grabberX));
    electronSelect.value = "1";
    lastScaleLevel = 1;
    updatePhotonReadouts();
    updateLevelUI();
    srStatus.textContent = "Simulation reset.";
  }

  /* =========================================================================
   * 5k -- canvas backing resolution (HiDPI; stage coordinates unchanged)
   * ======================================================================= */
  function resizeBacking() {
    const dpr = window.devicePixelRatio || 1;
    if (!atomCanvas._baseW) { atomCanvas._baseW = 769; atomCanvas._baseH = 250; }
    atomCanvas.width = atomCanvas._baseW * dpr;
    atomCanvas.height = atomCanvas._baseH * dpr;
    atomCanvas.style.aspectRatio = atomCanvas._baseW + " / " + atomCanvas._baseH;
  }
  window.addEventListener("resize", resizeBacking);

  /* =========================================================================
   * 5l -- main loop
   * ======================================================================= */
  function frame() {
    if (!paused) sim.tick();
    renderAtom();
    if (sim.scaleMC.level !== lastScaleLevel) {
      lastScaleLevel = sim.scaleMC.level;
      updateLevelUI();
    }
    syncControlAvailability();
    requestAnimationFrame(frame);
  }

  /* =========================================================================
   * 5m -- boot
   * ======================================================================= */
  window.klunlInitEqn = function () { updatePhotonReadouts(); updateLevelUI(); };

  // The shared masthead labels its help button "Review Help Guide" until first opened;
  // relabel it to just "Help" at runtime (the foundation file itself is left unchanged).
  function relabelHelpButton() {
    const mh = document.querySelector("kl-unl-masthead");
    const btn = mh && mh.shadowRoot && mh.shadowRoot.getElementById("helpBtn-mh");
    if (!btn) return false;
    btn.textContent = "Help";
    btn.classList.remove("initial-prompt");
    return true;
  }
  (function pollHelp(n) {
    if (relabelHelpButton() || n <= 0) return;
    setTimeout(function () { pollHelp(n - 1); }, 100);
  })(60);

  let _booted = false;
  function boot() {
    if (_booted) return;          // run exactly once (guards the .then/.catch fallback)
    _booted = true;
    buildPresetButtons();
    buildPhotonBars();
    resizeBacking();
    sim.sliderMC.moveGrabber(INITIAL_GRABBER_X);
    photonRange.value = String(Math.round(sim.sliderMC.grabberX));
    updatePhotonReadouts();
    updateLevelUI();
    requestAnimationFrame(frame);
  }

  // Boot once MathJax is ready (so the equation typesetting is available); fall
  // back to fonts-ready, then to immediate. The _booted guard above makes the
  // .catch fallbacks harmless if a promise rejects.
  if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
    window.MathJax.startup.promise.then(boot, boot);
  } else if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(boot, boot);
  } else {
    boot();
  }
})();
