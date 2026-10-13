// Adult choking (severe airway obstruction). node choking-adult.mjs [--dark] → choking-adult.html
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as m from "../kit/body.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const S = 26; // px per head
const FLOOR = 238;
const STAND = FLOOR - (m.BUILDS.adult.thigh + m.BUILDS.adult.shin) * S; // hip height of a standing adult
const floor = m.ground(FLOOR, 24, 296);

// 1. Recognise: cannot speak, cough or breathe; hands go to the throat.
function recognise() {
  const throat = m.figure({ at: [150, STAND], scale: S, pose: { head: 8 } }).at.throat; // pose once to find the landmark
  const victim = m.figure({ at: [150, STAND], scale: S, pose: { head: 8, armNear: [138, -22], armFar: [146, -14] } });
  return [floor, victim.svg, m.target(throat, 17), m.callout(victim.at.mouth, "no sound, no cough", { dx: 34, dy: -30 })];
}

// 2. Five back blows: lean them well forward, support the chest, strike between the shoulder blades.
function backBlows() {
  return m.animated(backBlowsAt, { frames: 14, seconds: 1.1, still: 0.45 });
}
function backBlowsAt(t) {
  const lift = m.keyed(t, [[0, 1], [0.45, 0, "in"], [0.6, 0], [1, 1, "out"]]); // 1 = hand raised, 0 = landed
  const victim = m.figure({ at: [186, STAND], scale: S, pose: { torso: 62, head: 80, armNear: [150, 120], armFar: [160, 130], legNear: [176, 184], legFar: [186, 176] } });
  const blades = victim.at.shoulderBlades;
  const rescuer = m.figure({
    at: [150, STAND], scale: S, tone: "b",
    pose: { torso: 8, head: 30, armNear: { to: [blades[0] - 6 - 14 * lift, blades[1] - 14 - 34 * lift], bend: 1 }, armFar: [100, 80], legNear: [170, 184], legFar: [196, 178] },
    lit: ["armNear"],
  });
  const P = rescuer.parts;
  const hand = rescuer.at.handNear;
  return [floor, P.legFar, P.torso, P.head, P.legNear, P.armFar, victim.svg, P.armNear, m.target(blades, 10), m.arrow([hand[0] + 16, hand[1] - 22], [blades[0] + 6, blades[1] - 14], { bow: 8, repeat: true }), m.count([262, 60], "×5")];
}

// 3. Five abdominal thrusts: fist just above the navel, pull sharply inward and upward.
function thrusts() {
  return m.animated(thrustsAt, { frames: 14, seconds: 1.2, still: 0.4 });
}
function thrustsAt(t) {
  const pull = m.keyed(t, [[0, 0], [0.4, 1, "in"], [0.55, 1], [1, 0, "out"]]); // 1 = fist pulled in and up
  const victim = m.figure({ at: [170, STAND], scale: S, pose: { torso: 14 - 3 * pull, head: 24 + 10 * pull, armNear: [140, 100], armFar: [150, 110] } });
  const spot = victim.at.upperAbdomen;
  const rescuer = m.figure({
    at: [138, STAND + 2], scale: S, tone: "b",
    pose: { torso: 12, head: 14, armNear: { to: [spot[0] + 8 - 7 * pull, spot[1] + 3 - 8 * pull], bend: -1 }, armFar: { to: [spot[0] + 6 - 7 * pull, spot[1] + 8 - 8 * pull], bend: -1 }, legNear: [166, 186], legFar: [196, 180] },
    lit: ["armNear"],
  });
  const P = rescuer.parts;
  const V = victim.parts;
  return [floor, P.legFar, P.armFar, P.torso, P.head, P.legNear, V.armFar, V.legFar, V.torso, V.head, V.legNear, P.armNear, V.armNear, m.arrow([spot[0] + 50, spot[1] + 30], [spot[0] + 20, spot[1] - 2], { bow: 8, repeat: true }), m.callout(victim.at.navel, "above the navel", { dx: 30, dy: 44 }), m.count([256, 60], "×5")];
}

// 4. If they go limp: lower them to the floor, call, start CPR. The rescuer kneels beside the chest, arms straight.
function collapse() {
  return m.animated(collapseAt, { frames: 12, seconds: 0.55, still: 0.5 }); // 0.55 s per push ≈ 110 a minute
}
function collapseAt(t) {
  const down = m.keyed(t, [[0, 0], [0.5, 1], [1, 0]]) * 6; // px the chest is pressed (5–6 cm at this scale)
  const victim = m.figure({ at: [196, FLOOR - 14], scale: S, pose: { torso: -90, head: -90, armNear: [92, 90], armFar: [92, 90], legNear: [90, 90], legFar: [90, 88], footNear: 0, footFar: 0 } });
  const chest = victim.at.sternum;
  const rescuer = m.figure({
    at: [chest[0] + 40, FLOOR - 50], scale: S, tone: "b", facing: -1,
    pose: { torso: 35 + down * 0.9, head: 60 + down * 0.9, armNear: { to: [chest[0] + 2, chest[1] - 8 + down], bend: 1 }, armFar: { to: [chest[0] - 3, chest[1] - 6 + down], bend: 1 }, legNear: [176, -90], legFar: [184, -90], footNear: -90, footFar: -90 },
    lit: ["armNear"],
  });
  const P = rescuer.parts;
  return [floor, P.legFar, P.legNear, P.torso, P.head, victim.svg, P.armFar, P.armNear, m.target(chest, 9), m.arrow([chest[0] - 30, chest[1] - 60], [chest[0] - 30, chest[1] - 16], { both: true }), m.count([252, 58], "30 : 2")];
}

const panels = [
  m.panel({ n: 1, title: "Ask: “Are you choking?”", text: "If they cannot speak, cough or breathe, the airway is blocked. Tell them you will help. If they can cough, encourage coughing and do nothing else.", body: recognise() }),
  m.panel({ n: 2, title: "Give 5 back blows", text: "Stand to the side and slightly behind. Support the chest, lean them well forward, and strike hard between the shoulder blades with the heel of your hand.", body: backBlows() }),
  m.panel({ n: 3, title: "Give 5 abdominal thrusts", text: "Stand behind, arms around the waist. Fist just above the navel, other hand over it. Pull sharply inward and upward. Alternate 5 and 5 until it clears.", body: thrusts() }),
  m.panel({ n: 4, kind: "warn", title: "If they become unresponsive", text: "Lower them to the floor, call the emergency number and start CPR: 30 compressions, then 2 breaths. Look in the mouth before each breath and remove only what you can see.", body: collapse() }),
];

const html = m.page({
  title: "Choking: adult or child over 1 year",
  lede: "Someone who suddenly cannot speak, cough or breathe, often with their hands at their throat, has a severe airway obstruction.",
  call: "Have someone call the emergency number as soon as the airway is blocked. Call yourself if you are alone and the first cycles do not work.",
  panels,
  donts: ["Do not sweep the mouth blindly with a finger: it can push the object deeper.", "Do not give abdominal thrusts to an infant under 1 year or to someone visibly pregnant: use chest thrusts.", "Do not slap the back of someone who is still coughing forcefully."],
  notes: ["Anyone who received abdominal thrusts should be checked by a doctor afterwards."],
  source: "European Resuscitation Council and Red Cross first-aid guidance; the American Heart Association’s 2025 guidelines also start with back blows",
  theme: process.argv.includes("--dark") ? "dark" : "light",
});
writeFileSync(join(HERE, "choking-adult.html"), html);
console.log("wrote choking-adult.html");
