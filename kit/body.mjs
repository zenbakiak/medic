// medic kit: a posable pictogram person, instruction marks, step panels and a page.
// Plain ESM, no dependencies. Everything returns SVG/HTML strings.
//
// Angles are compass directions on the page, in degrees: 0 = up, 90 = forward
// (the way the figure faces), 180 = down, -90 = backward. `facing` (1 = right,
// -1 = left) mirrors them, so a pose can be flipped without retyping it.
// Lengths are in heads: `scale` is the pixel height of one adult head.

const RAD = Math.PI / 180;
const n1 = (value) => Math.round(value * 10) / 10;
const pt = ([x, y]) => `${n1(x)} ${n1(y)}`;
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const escape = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Segment lengths and widths in heads. A child's and an infant's head is larger
// against the body, which is what makes them read as a child and an infant.
export const BUILDS = {
  adult: { head: [0.43, 0.52], neck: 0.22, torso: 2.55, upper: 1.3, fore: 1.15, thigh: 1.8, shin: 1.75, foot: 0.6, arm: 0.36, leg: 0.5, trunk: 1.05, front: 1.3, shoulders: 0.62, hips: 0.34, hand: 0.19 },
  child: { head: [0.42, 0.5], neck: 0.16, torso: 1.95, upper: 0.95, fore: 0.85, thigh: 1.2, shin: 1.15, foot: 0.45, arm: 0.3, leg: 0.4, trunk: 0.85, front: 1.05, shoulders: 0.5, hips: 0.3, hand: 0.16 },
  infant: { head: [0.46, 0.5], neck: 0.08, torso: 1.45, upper: 0.58, fore: 0.5, thigh: 0.62, shin: 0.58, foot: 0.3, arm: 0.28, leg: 0.36, trunk: 0.8, front: 0.95, shoulders: 0.42, hips: 0.28, hand: 0.14 },
};

/** Elbow or knee for a two-bone limb reaching from `root` to `target`. `bend` picks the side it bends to. */
export function reach(root, target, a, b, bend = 1) {
  const delta = sub(target, root);
  if (len(delta) > a + b + 8) console.warn(`medic: reach target ${target.map(n1)} is ${n1(len(delta) - a - b)} px beyond the limb; the hand will stop short. Move the figure closer.`);
  const d = Math.min(Math.max(len(delta), Math.abs(a - b) + 1e-3), a + b - 1e-3);
  const along = unit(delta);
  const x = (a * a - b * b + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  const mid = add(add(root, along, x), [-along[1], along[0]], h * bend);
  return { mid, end: add(root, along, d) };
}

/**
 * One person. Returns { svg, parts, at } where `at` holds every joint and body
 * landmark as page points, so hands, arrows, marks and a second figure can be
 * placed on the body instead of guessed.
 *
 * pose: torso, head (angles; head defaults to torso), and per limb either
 *   [upperAngle, lowerAngle] or { to: [x, y], bend: 1 | -1 } to reach a point.
 *   Side view limbs: armNear, armFar, legNear, legFar. Front view: armL, armR, legL, legR
 *   (L and R are the figure's left and right on the page).
 */
export function figure({ at: root = [0, 0], scale = 40, facing = 1, view = "side", build = "adult", pose = {}, tone = "a", lit = [], ghost = false, face = true } = {}) {
  const B = BUILDS[build];
  const S = scale;
  const dir = (angle) => [Math.sin(angle * RAD) * facing, -Math.cos(angle * RAD)];
  const torso = pose.torso ?? 0;
  const T = dir(torso);
  const N = dir(torso + 90); // out of the chest
  const hip = root;
  const neck = add(hip, T, B.torso * S);
  const headAngle = pose.head ?? torso;
  const Hd = dir(headAngle);
  const Hf = dir(headAngle + 90); // out of the face
  const skull = add(add(neck, Hd, (B.neck + B.head[1]) * S), Hf, view === "side" ? 0.06 * S : 0);
  const side = view === "side";
  const across = side ? [0, 0] : [T[1] * -1, T[0]]; // the figure's left-to-right on the page, front view
  const limb = (origin, spec, a, b, fallback, bend) => {
    if (spec && !Array.isArray(spec)) {
      const solved = reach(origin, spec.to, a * S, b * S, (spec.bend ?? bend) * facing);
      return [origin, solved.mid, solved.end];
    }
    const [first, second] = spec ?? fallback;
    const mid = add(origin, dir(first), a * S);
    return [origin, mid, add(mid, dir(second), b * S)];
  };
  const shoulder = add(neck, T, -0.18 * S);
  const names = side ? ["armFar", "legFar", "armNear", "legNear"] : ["armL", "legL", "armR", "legR"];
  const chains = {};
  names.forEach((name) => {
    const isArm = name.startsWith("arm");
    const sign = side ? 0 : name.endsWith("L") ? -1 : 1;
    const origin = add(isArm ? shoulder : hip, across, sign * (isArm ? B.shoulders : B.hips) * S);
    const rest = side ? [180, 180] : [180 + sign * (isArm ? 8 : 3), 180 + sign * (isArm ? 4 : 3)];
    chains[name] = limb(origin, pose[name], isArm ? B.upper : B.thigh, isArm ? B.fore : B.shin, rest, isArm ? -1 : 1);
  });

  const classes = (name) => `mp-part${lit.includes(name) || lit.includes(name.replace(/(Near|Far|L|R)$/, "")) ? " mp-lit" : ""}`;
  const tube = (name, points, width, extra = "") => {
    const d = `M${points.map(pt).join("L")}`;
    return `<g class="${classes(name)}" data-part="${name}"><path class="mp-edge" d="${d}" stroke-width="${n1(width * S + 2.4)}"/>${extra}<path class="mp-skin" d="${d}" stroke-width="${n1(width * S)}"/></g>`;
  };
  const parts = {};
  for (const name of names) {
    const [a, b, c] = chains[name];
    const isArm = name.startsWith("arm");
    if (isArm) {
      const hand = add(c, unit(sub(c, b)), B.hand * 0.7 * S);
      parts[name] = tube(name, [a, b, c], B.arm) + `<g class="${classes(name)}" data-part="${name}"><circle class="mp-blob" cx="${n1(hand[0])}" cy="${n1(hand[1])}" r="${n1(B.hand * S)}"/></g>`;
      chains[name].hand = hand;
    } else {
      // feet point forward in side view, down the page in front view
      const shin = unit(sub(c, b));
      const toe = side ? add(c, dir((pose[name.replace("leg", "foot")] ?? Math.atan2(shin[0] * facing, -shin[1]) / RAD - 90)), B.foot * S) : add(c, shin, B.foot * 0.5 * S);
      parts[name] = tube(name, [a, b, c, toe], B.leg);
      chains[name].toe = toe;
    }
  }
  const trunk = side ? B.trunk : B.front;
  parts.torso = tube("torso", [add(hip, T, 0.12 * S), add(neck, T, -0.42 * S)], trunk);
  const [rx, ry] = [B.head[0] * S, B.head[1] * S];
  const turn = Math.atan2(Hd[0], -Hd[1]) / RAD;
  const nose = add(skull, Hf, rx * 0.98);
  const eye = add(add(skull, Hf, rx * 0.5), Hd, ry * 0.12);
  parts.head =
    tube("neck", [add(neck, T, -0.1 * S), add(neck, Hd, (B.neck + 0.2) * S)], B.arm * 0.95) +
    `<g class="${classes("head")}" data-part="head">` +
    (side && face ? `<circle class="mp-blob" cx="${n1(nose[0])}" cy="${n1(nose[1])}" r="${n1(0.1 * S)}"/>` : "") +
    `<ellipse class="mp-blob" cx="${n1(skull[0])}" cy="${n1(skull[1])}" rx="${n1(rx)}" ry="${n1(ry)}" transform="rotate(${n1(turn)} ${pt(skull)})"/>` +
    (side && face ? `<circle class="mp-eye" cx="${n1(eye[0])}" cy="${n1(eye[1])}" r="${n1(0.045 * S)}"/>` : "") +
    `</g>`;

  const order = side ? ["armFar", "legFar", "torso", "head", "legNear", "armNear"] : ["legL", "legR", "torso", "armL", "armR", "head"];
  const half = (trunk * S) / 2;
  const onTrunk = (share, out) => add(add(hip, T, share * B.torso * S), N, out * half);
  const at = {
    hip, neck, shoulder, head: skull,
    crown: add(skull, Hd, ry), chin: add(add(skull, Hd, -ry * 0.8), Hf, rx * 0.5),
    mouth: add(add(skull, Hd, -ry * 0.42), Hf, rx * 0.9), nose, forehead: add(add(skull, Hd, ry * 0.5), Hf, rx * 0.85),
    nape: add(add(neck, Hd, B.neck * S), Hf, -B.arm * 0.45 * S),
    throat: add(add(neck, Hd, B.neck * 0.5 * S), Hf, B.arm * 0.45 * S),
    // on the front of the trunk (side view) or its midline (front view)
    sternum: onTrunk(0.7, side ? 1 : 0), xiphoid: onTrunk(0.55, side ? 1 : 0), upperAbdomen: onTrunk(0.42, side ? 1 : 0), navel: onTrunk(0.3, side ? 1 : 0),
    // on the back
    shoulderBlades: onTrunk(0.78, side ? -1 : 0), lowerBack: onTrunk(0.25, side ? -1 : 0),
    out: N, up: T, faceOut: Hf,
  };
  for (const name of names) {
    const [, mid, end] = chains[name];
    const key = name.replace(/^(arm|leg)/, "");
    if (name.startsWith("arm")) Object.assign(at, { [`elbow${key}`]: mid, [`wrist${key}`]: end, [`hand${key}`]: chains[name].hand, [`upperArm${key}`]: add(chains[name][0], sub(mid, chains[name][0]), 0.5), [`forearm${key}`]: add(mid, sub(end, mid), 0.5) });
    else Object.assign(at, { [`knee${key}`]: mid, [`ankle${key}`]: end, [`toe${key}`]: chains[name].toe, [`thigh${key}`]: add(chains[name][0], sub(mid, chains[name][0]), 0.5), [`shin${key}`]: add(mid, sub(end, mid), 0.5) });
  }
  const wrap = (inner) => `<g class="mp-figure" data-tone="${tone}"${ghost ? ' data-ghost=""' : ""}>${inner}</g>`;
  for (const name of Object.keys(parts)) parts[name] = wrap(parts[name]);
  return { svg: order.map((name) => parts[name]).join(""), parts, at, order };
}

// ---------- instruction marks ----------

/** A movement or direction arrow. `bow` bends it (px, sign picks the side); `repeat` draws it doubled for "again and again". */
export function arrow(from, to, { bow = 0, tone = "accent", repeat = false, both = false, dashed = false } = {}) {
  const mid = add(add(from, sub(to, from), 0.5), [-(to[1] - from[1]), to[0] - from[0]].map((v) => v / (len(sub(to, from)) || 1)), bow);
  const d = `M${pt(from)}Q${pt(mid)} ${pt(to)}`;
  const tip = (end, toward) => {
    const u = unit(sub(end, toward));
    const side = [-u[1], u[0]];
    return `<path class="mp-tip" d="M${pt(end)}L${pt(add(add(end, u, -9), side, 4.4))}L${pt(add(add(end, u, -9), side, -4.4))}Z"/>`;
  };
  const shift = repeat ? `<path class="mp-stroke" d="${d}" transform="translate(${pt(add([0, 0], unit([-(to[1] - from[1]), to[0] - from[0]]), 7))})" opacity=".45"/>` : "";
  return `<g class="mp-arrow" data-tone="${tone}">${shift}<path class="mp-stroke"${dashed ? ' stroke-dasharray="4 4"' : ""} d="${d}"/>${tip(to, mid)}${both ? tip(from, mid) : ""}</g>`;
}

/** A target on the body: a ring with a centre dot. Put it on a landmark from `figure().at`. */
export const target = (at, r = 9, tone = "accent") => `<g class="mp-target" data-tone="${tone}"><circle class="mp-stroke" cx="${n1(at[0])}" cy="${n1(at[1])}" r="${r}"/><circle class="mp-dot" cx="${n1(at[0])}" cy="${n1(at[1])}" r="2.2"/></g>`;

/** A short label with a leader line to a point. Keep to a few words; the caption carries the sentence. */
export function callout(at, text, { dx = 40, dy = -30, tone = "ink", anchor = dx < 0 ? "end" : "start" } = {}) {
  const end = add(at, [dx, dy]);
  const shift = anchor === "end" ? -5 : anchor === "start" ? 5 : 0;
  return `<g class="mp-callout" data-tone="${tone}"><path class="mp-stroke" d="M${pt(at)}L${pt(end)}"/><circle class="mp-dot" cx="${n1(at[0])}" cy="${n1(at[1])}" r="2"/><text x="${n1(end[0] + shift)}" y="${n1(end[1] + (anchor === "middle" ? (dy < 0 ? -6 : 14) : 4))}" text-anchor="${anchor}">${escape(text)}</text></g>`;
}

/** Plain small text in the drawing, for naming a prop or a forbidden item. `anchor`: start | middle | end. */
export const label = (at, text, { anchor = "middle", tone = "ink" } = {}) => `<text class="mp-label" data-tone="${tone}" x="${n1(at[0])}" y="${n1(at[1])}" text-anchor="${anchor}">${escape(text)}</text>`;

/** A big count or rate beside the action: "×5", "30 : 2", "100–120/min", "20 min". */
export const count = (at, text, { tone = "accent", size = 22 } = {}) => `<text class="mp-count" data-tone="${tone}" x="${n1(at[0])}" y="${n1(at[1])}" font-size="${size}" text-anchor="middle">${escape(text)}</text>`;

/** The red "do not" sign over something (ice on a burn, a finger sweep, a tilted-back head in a nosebleed). */
export const forbid = (at, r = 22, caption) => `<g class="mp-forbid"><circle cx="${n1(at[0])}" cy="${n1(at[1])}" r="${r}"/><path d="M${n1(at[0] - r * 0.7)} ${n1(at[1] - r * 0.7)}L${n1(at[0] + r * 0.7)} ${n1(at[1] + r * 0.7)}"/></g>${caption ? label([at[0], at[1] + r + 18], caption) : ""}`;

/** The floor, a bed edge or a table top. */
export const ground = (y, x0, x1) => `<path class="mp-ground" d="M${n1(x0)} ${n1(y)}L${n1(x1)} ${n1(y)}"/>`;

/** Any outlined shape as a prop: `d` is an SVG path. `fill` is "paper", "soft", "accent" or "none". */
export const prop = (d, { fill = "paper", tone = "ink", dashed = false } = {}) => `<path class="mp-prop" data-fill="${fill}" data-tone="${tone}"${dashed ? ' stroke-dasharray="4 4"' : ""} d="${d}"/>`;
export const box = (x, y, w, h, r = 4) => `M${n1(x + r)} ${n1(y)}h${n1(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${n1(h - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${r}h${n1(-(w - 2 * r))}a${r} ${r} 0 0 1 ${-r} ${-r}v${n1(-(h - 2 * r))}a${r} ${r} 0 0 1 ${r} ${-r}Z`;

/** Falling drops (running water over a burn, a nosebleed, saline). */
export function drops(from, to, { n = 5, tone = "water" } = {}) {
  let out = "";
  for (let i = 0; i < n; i++) {
    const p = add(from, sub(to, from), (i + 0.5) / n);
    const x = p[0] + ((i * 37) % 9) - 4;
    out += `<path d="M${n1(x)} ${n1(p[1] - 5)}q4 6 0 9q-4 -3 0 -9Z"/>`;
  }
  return `<g class="mp-drops" data-tone="${tone}">${out}</g>`;
}

// ---------- close-ups and common props ----------

/**
 * A forearm and hand, large, for work on a small area (a burn, a wound, a bandage, an injection site).
 * `at` is the elbow end on the arm's centre line; the hand is `length` px away toward `facing`.
 * Returns { svg, at } with points: elbow, mid, wrist, palm, fingertips, thumb, and top/under (the upper and lower edge at mid).
 */
export function forearm({ at: [x, y], length = 230, width = 46, facing = 1, tone = "a" } = {}) {
  const f = facing;
  const w = width / 2;
  const wrist = x + f * length * 0.68;
  const tip = x + f * length;
  const X = (value) => n1(value);
  const arm = `M${X(x)} ${n1(y - w)}L${X(wrist)} ${n1(y - w * 0.72)}C${X(wrist + f * length * 0.1)} ${n1(y - w * 0.95)} ${X(tip)} ${n1(y - w * 0.9)} ${X(tip)} ${n1(y)}C${X(tip)} ${n1(y + w * 0.9)} ${X(wrist + f * length * 0.1)} ${n1(y + w * 0.95)} ${X(wrist)} ${n1(y + w * 0.72)}L${X(x)} ${n1(y + w)}`;
  const thumb = `M${X(wrist + f * 6)} ${n1(y - w * 0.74)}C${X(wrist + f * 14)} ${n1(y - w * 1.9)} ${X(wrist + f * 40)} ${n1(y - w * 1.9)} ${X(wrist + f * 44)} ${n1(y - w * 1.45)}C${X(wrist + f * 30)} ${n1(y - w * 1.3)} ${X(wrist + f * 30)} ${n1(y - w * 0.9)} ${X(wrist + f * 36)} ${n1(y - w * 0.85)}`;
  return {
    svg: `<g class="mp-closeup" data-tone="${tone}"><path class="mp-flesh" d="${thumb}"/><path class="mp-flesh" d="${arm}"/></g>`,
    at: { elbow: [x, y], mid: [x + f * length * 0.36, y], wrist: [wrist, y], palm: [wrist + f * length * 0.14, y], fingertips: [tip, y], thumb: [wrist + f * 34, y - w * 1.6], top: [x + f * length * 0.36, y - w * 0.86], under: [x + f * length * 0.36, y + w * 0.86] },
  };
}

/** An injured area on a close-up: a soft-edged accent patch (burn, wound, rash). `blisters` adds a few raised dots. */
export function patch(at, rx = 34, ry = 16, { blisters = 0 } = {}) {
  let dots = "";
  for (let i = 0; i < blisters; i++) dots += `<circle class="mp-blister" cx="${n1(at[0] + ((i * 53) % (rx * 1.2)) - rx * 0.6)}" cy="${n1(at[1] + ((i * 29) % (ry * 1.1)) - ry * 0.55)}" r="3.2"/>`;
  return `<g class="mp-patch"><ellipse cx="${n1(at[0])}" cy="${n1(at[1])}" rx="${rx}" ry="${ry}"/>${dots}</g>`;
}

/**
 * A cross-section of skin for injections and burn depth. Layers top to bottom: skin, fat, muscle, in px
 * (draw them in proportion: skin about 2 mm, fat about 12 mm). `fold` lifts a pinched skin fold that many px
 * in the middle: skin and fat rise, the muscle stays down, which is the point of pinching.
 * Returns { svg, at: { surface, skin, fat, muscle, foldLeft, foldRight } }; `surface` is the top of the fold.
 */
export function skinSection({ x = 40, y = 70, width = 240, skin = 14, fat = 70, muscle = 44, fold = 0, foldWidth = 34 } = {}) {
  const cx = x + width / 2;
  const top = (px) => y - fold * Math.exp(-(((px - cx) / foldWidth) ** 2) * 1.6);
  const xs = Array.from({ length: 49 }, (_, i) => x + (width * i) / 48);
  const upper = xs.map((px) => `${n1(px)} ${n1(top(px))}`);
  const lower = [...xs].reverse().map((px) => `${n1(px)} ${n1(top(px) + skin)}`);
  const lines = [];
  for (let i = 1; i <= 3; i++) lines.push(`M${x} ${n1(y + skin + fat + (muscle * i) / 4)}h${width}`);
  const lobes = [];
  for (let row = 0; row < 2; row++) for (let px = x + 18 + row * 14; px < x + width - 10; px += 28) lobes.push(`<circle cx="${px}" cy="${n1(y + skin + fat * (0.3 + row * 0.4) - (top(px) < y - 1 ? (y - top(px)) * 0.5 : 0))}" r="10"/>`);
  return {
    svg: `<g class="mp-section"><rect class="mp-band" data-layer="muscle" x="${x}" y="${y + skin + fat}" width="${width}" height="${muscle}"/><path class="mp-fibre" d="${lines.join("")}"/><path class="mp-band" data-layer="fat" d="M${upper.join("L")}L${x + width} ${y + skin + fat}L${x} ${y + skin + fat}Z"/><g class="mp-lobes">${lobes.join("")}</g><path class="mp-band" data-layer="skin" d="M${upper.join("L")}L${lower.join("L")}Z"/></g>`,
    at: { surface: [cx, y - fold], skin: [cx, y - fold + skin / 2], fat: [cx, y + skin + fat / 2], muscle: [cx, y + skin + fat + muscle / 2], foldLeft: [cx - foldWidth * 0.75, y - fold * 0.45], foldRight: [cx + foldWidth * 0.75, y - fold * 0.45] },
  };
}

/**
 * A syringe, upright, with its needle tip at `tip`. `up: true` points the needle upward (drawing from an inverted vial).
 * `pulled` (0..1) is how far the plunger is drawn back; `fluid` (0..pulled) is how much of that is liquid, the rest air.
 * Returns { svg, at: { tip, hub, barrel, plunger } }.
 */
export function syringe([x, y], { length = 96, needle = 18, width = 15, up = false, pulled = 0, fluid = 0 } = {}) {
  const f = up ? 1 : -1; // direction from tip toward the plunger, in page y
  const rect = (d0, d1, w, r = 2) => box(x - w / 2, Math.min(y + f * d0, y + f * d1), w, Math.abs(d1 - d0), r);
  const hub = needle + 7;
  const end = hub + length;
  const room = length - 10;
  const stopper = hub + 3 + room * pulled;
  const ticks = [];
  for (let i = 1; i <= 9; i++) ticks.push(`M${n1(x - width / 2)} ${n1(y + f * (hub + 3 + (room * i) / 10))}h${i % 5 ? 4 : 7}`);
  return {
    svg:
      prop(`M${x} ${y}V${n1(y + f * needle)}`, { fill: "none" }) +
      prop(rect(needle, hub, width * 0.42, 1.5), { fill: "soft" }) +
      prop(rect(stopper + 5, end + 14 + room * pulled, width * 0.3, 1.5), { fill: "soft" }) +
      prop(rect(hub, end, width, 2.5), { fill: "paper" }) +
      (fluid > 0.01 ? prop(rect(hub + 2, hub + 3 + room * Math.min(fluid, pulled), width - 4, 1), { fill: "water", tone: "mid" }) : "") +
      prop(rect(stopper, stopper + 5, width - 3, 1.5), { fill: "ink" }) +
      prop(ticks.join(""), { fill: "none", tone: "mid" }) +
      prop(rect(end, end + 3, width * 1.9, 1.5), { fill: "soft" }) +
      prop(rect(end + 14 + room * pulled, end + 18 + room * pulled, width * 1.3, 1.5), { fill: "soft" }),
    at: { tip: [x, y], hub: [x, y + f * needle], barrel: [x, y + f * (hub + length / 2)], plunger: [x, y + f * (end + 18 + room * pulled)] },
  };
}

/**
 * A medicine vial with the centre of its rubber stopper at `mouth`. Upright, the body is below the mouth;
 * `inverted: true` puts the body above it, as when drawing a dose. `level` (0..1) is how full it is.
 */
export function vial([x, y], { inverted = false, level = 0.7, width = 44, height = 62 } = {}) {
  const f = inverted ? -1 : 1; // direction from the mouth into the body, in page y
  const rect = (d0, d1, w, r = 3) => box(x - w / 2, Math.min(y + f * d0, y + f * d1), w, Math.abs(d1 - d0), r);
  const body0 = 16;
  const liquid = (height - 6) * level;
  // liquid settles toward the ground: at the far end when upright, at the mouth end when inverted
  const pool = inverted ? rect(body0 + 2, body0 + 2 + liquid, width - 5, 2) : rect(body0 + height - 3 - liquid, body0 + height - 3, width - 5, 2);
  return prop(rect(body0, body0 + height, width, 6), { fill: "paper" }) + prop(pool, { fill: "water", tone: "mid" }) + prop(rect(6, body0, width * 0.5, 2), { fill: "paper" }) + prop(rect(0, 7, width * 0.62, 2), { fill: "soft" });
}

/** A tap with its spout mouth at `at`; pair it with `drops(at, …)`. */
export const tap = ([x, y]) => prop(`M${x - 9} ${y - 60}h18v46h-18Z`, { fill: "soft" }) + prop(box(x - 13, y - 14, 26, 10, 3), { fill: "soft" }) + prop(`M${x + 9} ${y - 44}h18`, { fill: "none" }) + prop(box(x + 27, y - 52, 9, 16, 3), { fill: "soft" });

/** A chair seen from the side. `seat` is the point under the sitter's hip; the back is behind a sitter facing `facing`. */
export const chair = ([x, y], facing = 1, size = 46) => prop(box(x - size / 2, y, size, 8, 3), { fill: "soft" }) + prop(`M${x - size / 2 + 4} ${y + 8}v${size}M${x + size / 2 - 4} ${y + 8}v${size}`, { fill: "none" }) + prop(box(x - facing * (size / 2) - 3, y - size, 6, size, 3), { fill: "soft" });

/**
 * The front of the trunk from the lower ribs to the hips, large, for injection sites and abdominal landmarks.
 * `at` is the navel; `cm` is px per centimetre, so distances on the body can be drawn true (`5 * cm` from the navel).
 * Returns { svg, at: { navel, left, right, above, below }, cm }.
 */
export function abdomen({ at: [x, y], cm = 6.5, tone = "a" } = {}) {
  const side = (f) => `M${n1(x + f * 15.5 * cm)} ${n1(y - 15 * cm)}C${n1(x + f * 15 * cm)} ${n1(y - 8 * cm)} ${n1(x + f * 13.2 * cm)} ${n1(y - 5 * cm)} ${n1(x + f * 13.6 * cm)} ${n1(y - 1 * cm)}C${n1(x + f * 14 * cm)} ${n1(y + 4 * cm)} ${n1(x + f * 16.5 * cm)} ${n1(y + 7 * cm)} ${n1(x + f * 16.8 * cm)} ${n1(y + 12 * cm)}`;
  const fill = `M${n1(x - 15.5 * cm)} ${n1(y - 15 * cm)}C${n1(x - 15 * cm)} ${n1(y - 8 * cm)} ${n1(x - 13.2 * cm)} ${n1(y - 5 * cm)} ${n1(x - 13.6 * cm)} ${n1(y - 1 * cm)}C${n1(x - 14 * cm)} ${n1(y + 4 * cm)} ${n1(x - 16.5 * cm)} ${n1(y + 7 * cm)} ${n1(x - 16.8 * cm)} ${n1(y + 12 * cm)}L${n1(x + 16.8 * cm)} ${n1(y + 12 * cm)}C${n1(x + 16.5 * cm)} ${n1(y + 7 * cm)} ${n1(x + 14 * cm)} ${n1(y + 4 * cm)} ${n1(x + 13.6 * cm)} ${n1(y - 1 * cm)}C${n1(x + 13.2 * cm)} ${n1(y - 5 * cm)} ${n1(x + 15 * cm)} ${n1(y - 8 * cm)} ${n1(x + 15.5 * cm)} ${n1(y - 15 * cm)}Z`;
  const ribs = `M${n1(x - 12 * cm)} ${n1(y - 9 * cm)}Q${n1(x)} ${n1(y - 19 * cm)} ${n1(x + 12 * cm)} ${n1(y - 9 * cm)}`;
  const band = `M${n1(x - 15.4 * cm)} ${n1(y + 8.5 * cm)}Q${n1(x)} ${n1(y + 11 * cm)} ${n1(x + 15.4 * cm)} ${n1(y + 8.5 * cm)}`;
  return {
    svg: `<g class="mp-closeup" data-tone="${tone}"><path class="mp-flesh-fill" d="${fill}"/><path class="mp-flesh-edge" d="${side(-1)}${side(1)}"/><path class="mp-hint" d="${ribs}${band}"/><path class="mp-flesh-edge" d="M${n1(x - 0.7 * cm)} ${n1(y - 0.3 * cm)}q${n1(0.7 * cm)} ${n1(1 * cm)} ${n1(1.4 * cm)} 0"/></g>`,
    at: { navel: [x, y], left: [x - 8 * cm, y], right: [x + 8 * cm, y], above: [x, y - 7 * cm], below: [x, y + 6 * cm] },
    cm,
  };
}

/**
 * An injection pen or auto-injector, upright, with its needle tip at `tip`. `up: true` points the needle upward (priming).
 * Returns { svg, at: { tip, hub, window, button } }.
 */
export function pen([x, y], { length = 130, needle = 12, width = 16, up = false, pressed = false } = {}) {
  const f = up ? 1 : -1; // direction from tip toward the button, in page y
  const Y = (d) => n1(y + f * d);
  const rect = (d0, d1, w, r = 3) => box(x - w / 2, Math.min(y + f * d0, y + f * d1), w, Math.abs(d1 - d0), r);
  const hub = needle + 9;
  const holder = hub + length * 0.36;
  const end = hub + length * 0.88;
  const knob = end + (pressed ? 2 : 9);
  return {
    svg:
      prop(`M${x} ${y}V${Y(needle)}`, { fill: "none" }) +
      prop(rect(needle, hub, width * 0.5, 2), { fill: "soft" }) +
      prop(rect(hub, holder, width * 0.8), { fill: "paper" }) +
      prop(rect(hub + 5, holder - 5, width * 0.34, 2), { fill: "water" }) +
      prop(rect(holder, end, width), { fill: "soft" }) +
      prop(rect(end, knob + 9, width * 0.8), { fill: "paper" }),
    at: { tip: [x, y], hub: [x, y + f * needle], window: [x, y + f * (hub + holder) / 2], button: [x, y + f * (knob + 9)] },
  };
}

/** A sharps container. `at` is the centre of its base. */
export const sharps = ([x, y], h = 64) => prop(box(x - h * 0.36, y - h, h * 0.72, h, 6), { fill: "soft" }) + prop(box(x - h * 0.4, y - h - 8, h * 0.8, 12, 4), { fill: "paper", tone: "accent" }) + prop(box(x - h * 0.16, y - h - 5, h * 0.32, 5, 2), { fill: "none" }) + prop(`M${x} ${n1(y - h * 0.62)}v${n1(h * 0.3)}M${n1(x - h * 0.15)} ${n1(y - h * 0.47)}h${n1(h * 0.3)}`, { fill: "none", tone: "accent" });

/** A phone showing a cross, for "call the emergency number" panels. `at` is its centre. */
export const phone = ([x, y], h = 80) => prop(box(x - h * 0.28, y - h / 2, h * 0.56, h, 7)) + prop(`M${n1(x - 7)} ${n1(y - h * 0.38)}h14`, { fill: "none" }) + prop(`M${x} ${n1(y - 11)}v22M${n1(x - 11)} ${y}h22`, { fill: "none", tone: "accent" });

// ---------- motion ----------

/** Blend two values of the same shape: numbers, points, arrays or whole pose objects (including `{ to }` targets). */
export function mix(a, b, u) {
  if (typeof a === "number" && typeof b === "number") return a + (b - a) * u;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((value, index) => mix(value, b[index], u));
  if (a && b && typeof a === "object" && typeof b === "object") return Object.fromEntries(Object.keys({ ...a, ...b }).map((key) => [key, key in a && key in b ? mix(a[key], b[key], u) : (a[key] ?? b[key])]));
  return u < 0.5 ? a : b;
}

const EASE = { linear: (u) => u, smooth: (u) => u * u * (3 - 2 * u), in: (u) => u * u, out: (u) => 1 - (1 - u) * (1 - u) };

/**
 * A value at time `t` (0..1 round the loop) from keyframes `[[time, value, ease?], …]`, times rising from 0.
 * After the last key it eases back to the first, so the loop closes. `ease` names how to arrive at that key:
 * "smooth" (default), "linear", "in" (accelerate: a blow landing) or "out" (decelerate: a release).
 */
export function keyed(t, keys) {
  const time = ((t % 1) + 1) % 1;
  const stops = [...keys, [1, keys[0][1], keys[0][2]]];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, from] = stops[i];
    const [t1, to, ease = "smooth"] = stops[i + 1];
    if (time >= t0 && time <= t1) return t1 === t0 ? to : mix(from, to, EASE[ease]((time - t0) / (t1 - t0)));
  }
  return keys[0][1];
}

/**
 * A looping drawing. `draw(t)` returns the panel body (string or array) for a moment t in 0..1; it is drawn
 * `frames` times and the page flips through them with CSS alone, so it needs no script, pauses for readers who
 * ask for reduced motion, and prints as the `still` moment (the frame that best shows the action).
 */
export function animated(draw, { frames = 16, seconds = 1.2, still = 0 } = {}) {
  const freeze = typeof process !== "undefined" ? process.env?.MEDIC_FREEZE : undefined;
  if (freeze !== undefined && freeze !== "") { const body = draw(Number(freeze) % 1); return Array.isArray(body) ? body.join("") : body; } // for looking at one moment
  const name = `mp-flip-${frames}`;
  const shown = Math.round(still * frames) % frames;
  let out = `<style>@keyframes ${name}{0%{visibility:visible}${n1(100 / frames)}%,100%{visibility:hidden}}</style>`;
  for (let i = 0; i < frames; i++) {
    const body = draw(i / frames);
    out += `<g class="mp-frame"${i === shown ? ' data-still=""' : ""} style="animation:${name} ${seconds}s steps(1,end) ${n1((i * seconds * 1000) / frames)}ms infinite">${Array.isArray(body) ? body.join("") : body}</g>`;
  }
  return out;
}

// ---------- panels and page ----------

/** One step: a numbered drawing with a title and one or two sentences. `kind`: "step" | "warn" (danger sign) | "dont". */
export function panel({ n, title, text, body, width = 320, height = 260, label, kind = "step" }) {
  return `<section class="mp-panel" data-kind="${kind}"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(label ?? `${title}. ${text ?? ""}`)}">${Array.isArray(body) ? body.join("") : body}</svg><div class="mp-words"><span class="mp-n">${escape(n ?? "")}</span><div><h3>${escape(title)}</h3>${text ? `<p>${escape(text)}</p>` : ""}</div></div></section>`;
}

/**
 * The whole sheet. `call` is the emergency line shown at the top ("Call 911 if…");
 * `donts` are short "do not" lines; `source` names the guideline and year the steps follow.
 */
export function page({ title, lede, call, panels, donts = [], notes = [], source, theme = "auto", lang = "en", columns = 2, disclaimer }) {
  const words = lang.startsWith("es")
    ? { dont: "No hagas esto", note: "Ten en cuenta", source: "Fuente", disclaimer: "Material educativo. No sustituye un curso de primeros auxilios ni la valoración de un profesional de la salud." }
    : { dont: "Do not", note: "Keep in mind", source: "Source", disclaimer: "Educational material. It does not replace first-aid training or assessment by a health professional." };
  const list = (items, kind, head) => (items.length ? `<div class="mp-list" data-kind="${kind}"><h4>${head}</h4><ul>${items.map((item) => `<li>${escape(item)}</li>`).join("")}</ul></div>` : "");
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title><style>${CSS}</style></head><body${theme === "auto" ? "" : ` data-theme="${theme}"`}><main class="mp-sheet"><header><h1>${escape(title)}</h1>${lede ? `<p class="mp-lede">${escape(lede)}</p>` : ""}${call ? `<p class="mp-call"><span aria-hidden="true">✚</span>${escape(call)}</p>` : ""}</header><div class="mp-grid" style="--mp-columns:${columns}">${panels.join("")}</div><footer>${list(donts, "dont", words.dont)}${list(notes, "note", words.note)}<p class="mp-source">${source ? `${words.source}: ${escape(source)}. ` : ""}${escape(disclaimer ?? words.disclaimer)}</p></footer></main></body></html>`;
}

export const CSS = `
:root{--mp-page:#f3f2ee;--mp-paper:#fcfcfa;--mp-ink:#1f1f23;--mp-mid:#77777d;--mp-faint:#d9d8d4;--mp-a:#ffffff;--mp-b:#cfd3d8;--mp-accent:#d9381e;--mp-water:#2f6fde;--mp-ok:#1f8a54;--mp-soft:#ecebe6}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) body:not([data-theme="light"]){--mp-page:#0c0c0d;--mp-paper:#151516;--mp-ink:#e4e4e6;--mp-mid:#8b8b92;--mp-faint:#2c2c30;--mp-a:#2a2a2e;--mp-b:#55575e;--mp-accent:#ff6a4d;--mp-water:#6b9bff;--mp-ok:#5fd39a;--mp-soft:#1d1d1f}}
body[data-theme="dark"]{--mp-page:#0c0c0d;--mp-paper:#151516;--mp-ink:#e4e4e6;--mp-mid:#8b8b92;--mp-faint:#2c2c30;--mp-a:#2a2a2e;--mp-b:#55575e;--mp-accent:#ff6a4d;--mp-water:#6b9bff;--mp-ok:#5fd39a;--mp-soft:#1d1d1f}
*{box-sizing:border-box}
body{margin:0;background:var(--mp-page);color:var(--mp-ink);font:15px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.mp-sheet{width:min(860px,100% - 32px);margin:40px auto 72px}
.mp-sheet h1{margin:0 0 6px;font-size:26px;line-height:1.2;letter-spacing:-.01em}
.mp-lede{margin:0 0 14px;color:var(--mp-mid);max-width:62ch}
.mp-call{display:flex;gap:10px;align-items:baseline;margin:0 0 18px;padding:10px 14px;border:1.5px solid var(--mp-accent);border-radius:8px;color:var(--mp-accent);font-weight:600}
.mp-grid{display:grid;grid-template-columns:repeat(var(--mp-columns,2),minmax(0,1fr));gap:14px}
@media (max-width:640px){.mp-grid{grid-template-columns:1fr}}
.mp-panel{background:var(--mp-paper);border:1px solid var(--mp-faint);border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
.mp-panel[data-kind="warn"],.mp-panel[data-kind="dont"]{border-color:var(--mp-accent)}
.mp-panel svg{display:block;width:100%;height:auto}
.mp-words{display:flex;gap:12px;padding:12px 14px 14px;border-top:1px solid var(--mp-faint)}
.mp-n{flex:none;width:26px;height:26px;border-radius:50%;background:var(--mp-ink);color:var(--mp-paper);font-weight:700;font-size:14px;display:grid;place-items:center}
.mp-n:empty{display:none}
.mp-panel[data-kind="warn"] .mp-n,.mp-panel[data-kind="dont"] .mp-n{background:var(--mp-accent)}
.mp-words h3{margin:2px 0 2px;font-size:15px;line-height:1.3}
.mp-words p{margin:0;color:var(--mp-mid);font-size:13.5px;line-height:1.45}
.mp-sheet footer{margin-top:18px;display:grid;gap:12px}
.mp-list h4{margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.08em}
.mp-list[data-kind="dont"] h4{color:var(--mp-accent)}
.mp-list ul{margin:0;padding-left:18px}
.mp-list li{margin:2px 0}
.mp-source{margin:0;color:var(--mp-mid);font-size:12.5px}
.mp-edge{fill:none;stroke:var(--mp-ink);stroke-linecap:round;stroke-linejoin:round}
.mp-skin{fill:none;stroke:var(--mp-a);stroke-linecap:round;stroke-linejoin:round}
.mp-blob{fill:var(--mp-a);stroke:var(--mp-ink);stroke-width:1.2}
.mp-eye{fill:var(--mp-ink)}
.mp-figure[data-tone="b"] .mp-skin{stroke:var(--mp-b)}
.mp-figure[data-tone="b"] .mp-blob{fill:var(--mp-b)}
.mp-figure .mp-lit .mp-edge{stroke:var(--mp-accent)}
.mp-figure .mp-lit .mp-blob{stroke:var(--mp-accent);stroke-width:1.8}
.mp-figure[data-ghost]{opacity:.35}
.mp-stroke{fill:none;stroke:var(--mp-ink);stroke-width:1.6;stroke-linecap:round}
.mp-tip,.mp-dot{fill:var(--mp-ink)}
[data-tone="accent"] .mp-stroke,[data-tone="accent"].mp-stroke{stroke:var(--mp-accent);stroke-width:2.2}
[data-tone="accent"] .mp-tip,[data-tone="accent"] .mp-dot{fill:var(--mp-accent)}
[data-tone="ok"] .mp-stroke{stroke:var(--mp-ok);stroke-width:2.2}
[data-tone="ok"] .mp-tip,[data-tone="ok"] .mp-dot{fill:var(--mp-ok)}
[data-tone="water"] .mp-stroke{stroke:var(--mp-water);stroke-width:2.2}
[data-tone="water"] .mp-tip{fill:var(--mp-water)}
.mp-callout text{fill:var(--mp-ink);font-size:11.5px;font-weight:600}
.mp-callout .mp-stroke{stroke-width:1}
.mp-label{fill:var(--mp-ink);font-size:11.5px;font-weight:600}
.mp-label[data-tone="accent"]{fill:var(--mp-accent)}
.mp-label[data-tone="mid"]{fill:var(--mp-mid);font-weight:500}
.mp-flesh{fill:var(--mp-a);stroke:var(--mp-ink);stroke-width:1.4;stroke-linejoin:round;stroke-linecap:round}
.mp-closeup[data-tone="b"] .mp-flesh{fill:var(--mp-b)}
.mp-flesh-fill{fill:var(--mp-a);stroke:none}
.mp-flesh-edge{fill:none;stroke:var(--mp-ink);stroke-width:1.4;stroke-linecap:round}
.mp-hint{fill:none;stroke:var(--mp-faint);stroke-width:1.4;stroke-linecap:round}
.mp-prop[data-tone="ok"]{stroke:var(--mp-ok)}
.mp-prop[data-fill="ok"]{fill:var(--mp-ok);fill-opacity:.16}
.mp-patch ellipse{fill:var(--mp-accent);fill-opacity:.3;stroke:var(--mp-accent);stroke-width:1.6;stroke-dasharray:1 4;stroke-linecap:round}
.mp-blister{fill:var(--mp-paper);stroke:var(--mp-accent);stroke-width:1.2}
.mp-band{stroke:var(--mp-ink);stroke-width:1.2;fill:var(--mp-a)}
.mp-band[data-layer="fat"]{fill:var(--mp-paper)}
.mp-band[data-layer="muscle"]{fill:var(--mp-soft)}
.mp-fibre{fill:none;stroke:var(--mp-mid);stroke-width:1}
.mp-lobes circle{fill:none;stroke:var(--mp-faint);stroke-width:1.2}
.mp-count{fill:var(--mp-accent);font-weight:800;font-variant-numeric:tabular-nums}
.mp-count[data-tone="ink"]{fill:var(--mp-ink)}
.mp-forbid circle,.mp-forbid path{fill:none;stroke:var(--mp-accent);stroke-width:3.2;stroke-linecap:round}
.mp-ground{fill:none;stroke:var(--mp-faint);stroke-width:2;stroke-linecap:round}
.mp-prop{stroke:var(--mp-ink);stroke-width:1.2;stroke-linejoin:round;stroke-linecap:round;fill:var(--mp-paper)}
.mp-prop[data-fill="none"]{fill:none}
.mp-prop[data-fill="soft"]{fill:var(--mp-soft)}
.mp-prop[data-fill="accent"]{fill:var(--mp-accent)}
.mp-prop[data-fill="ink"]{fill:var(--mp-ink)}
.mp-prop[data-fill="water"]{fill:var(--mp-water)}
.mp-prop[data-tone="accent"]{stroke:var(--mp-accent)}
.mp-prop[data-tone="mid"]{stroke:var(--mp-mid)}
.mp-drops path{fill:var(--mp-water)}
.mp-drops[data-tone="accent"] path{fill:var(--mp-accent)}
.mp-frame{visibility:hidden}
@media (prefers-reduced-motion:reduce){.mp-frame{animation:none!important}.mp-frame[data-still]{visibility:visible}}
@media print{.mp-frame{animation:none!important}.mp-frame[data-still]{visibility:visible}body{background:#fff}.mp-sheet{margin:0 auto}.mp-panel{break-inside:avoid}}
`;
