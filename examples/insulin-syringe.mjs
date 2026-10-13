// Inyección de insulina en el abdomen con jeringa y frasco. node insulin-syringe.mjs [--dark] → insulin-syringe.html
import { writeFileSync } from "node:fs";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as m from "../kit/body.mjs";
const HERE = dirname(fileURLToPath(import.meta.url));

const MM = 6; // px por milímetro en los cortes de piel
const SKIN = 2 * MM, FAT = 12 * MM, NEEDLE = 6 * MM; // aguja de jeringa de 6 mm
const DOSE = 0.5; // cuánto se llena la jeringa en el dibujo (la dosis real es la recetada)
const circle = ([x, y], r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

// 1. Todo listo: manos limpias, insulina revisada, jeringa nueva, tapón limpio.
function ready() {
  const s = m.syringe([92, 196], { needle: 16, length: 92 });
  return [m.ground(214, 30, 290), m.vial([206, 136], { level: 0.75 }), m.prop(m.box(196, 112, 28, 16, 5), { fill: "soft", tone: "mid" }), m.arrow([172, 108], [244, 108], { both: true, bow: -12, tone: "ink" }), m.label([210, 92], "limpia el tapón"), s.svg, m.callout(s.at.barrel, "jeringa nueva", { dx: 0, dy: -70, anchor: "middle" })];
}

// 2. Aire: jala el émbolo hasta tu dosis, pincha el frasco de pie y empuja el aire dentro.
function air(t) {
  const pulled = m.keyed(t, [[0, 0], [0.08, 0], [0.3, DOSE], [0.62, DOSE], [0.8, 0, "in"], [0.95, 0]]);
  const lift = m.keyed(t, [[0, 1], [0.34, 1], [0.56, 0], [0.92, 0], [1, 1]]) * 34;
  const mouth = [160, 168];
  const s = m.syringe([160, mouth[1] + 14 - lift], { needle: 20, length: 88, pulled });
  const going = t > 0.62 && t < 0.86;
  return [m.ground(248, 30, 290), s.svg, m.vial(mouth, { level: 0.75, height: 60 }), going ? m.arrow([196, 150], [196, 190], { tone: "ink" }) : "", m.count([248, 62], "aire = dosis", { size: 15 })];
}

// 3. Dosis: frasco boca abajo, punta de la aguja dentro del líquido, jala despacio hasta la marca.
function draw(t) {
  const fluid = m.keyed(t, [[0, 0], [0.12, 0], [0.6, DOSE], [0.92, DOSE], [1, 0]]);
  const mouth = [160, 92];
  const s = m.syringe([160, mouth[1] - 20], { up: true, needle: 20, length: 88, pulled: fluid, fluid });
  return [m.vial(mouth, { inverted: true, level: 0.75 - fluid * 0.3, height: 60 }), s.svg, m.arrow([196, s.at.plunger[1] - 30], [196, s.at.plunger[1] - 4], { tone: "ink" }), m.callout(s.at.barrel, "sin burbujas", { dx: -44, dy: 6 })];
}

// 4. Dónde: abdomen, a 5 cm del ombligo, cada vez a 1 cm del pinchazo anterior.
function site() {
  const belly = m.abdomen({ at: [160, 138] });
  const cm = belly.cm;
  const [x, y] = belly.at.navel;
  const spots = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) spots.push(`<circle class="mp-dot" cx="${x - 10.5 * cm + col * 1.5 * cm}" cy="${y - 4.6 * cm + row * 1.5 * cm}" r="1.8"/>`);
  return [
    belly.svg,
    m.prop(m.box(x - 12.4 * cm, y - 7 * cm, 24.8 * cm, 13.5 * cm, 4 * cm), { fill: "ok", tone: "ok" }),
    m.prop(circle([x, y], 5 * cm), { fill: "paper", tone: "accent", dashed: true }),
    m.prop(`M${x - 0.7 * cm} ${y - 0.3 * cm}q${0.7 * cm} ${cm} ${1.4 * cm} 0`, { fill: "none" }),
    `<g data-tone="accent">${spots.join("")}</g>`,
    m.arrow([x + 4, y + 12], [x + 5 * cm * 0.7, y + 5 * cm * 0.7], { tone: "ink" }),
    m.label([x + 5 * cm + 8, y + 5 * cm + 2], "5 cm", { tone: "accent", anchor: "start" }),
    m.callout([x - 10.5 * cm + 0.75 * cm, y - 4.6 * cm], "1 cm entre puntos", { dx: 14, dy: -50, anchor: "start" }),
  ];
}

// Corte de piel con pliegue: los dedos levantan piel y grasa; el músculo se queda abajo.
function fold(extra) {
  const cut = m.skinSection({ x: 84, y: 150, width: 208, skin: SKIN, fat: FAT - 12, muscle: 30, fold: 30, foldWidth: 30 });
  const finger = ([x, y], side) => m.prop(m.box(x - 9 + side * 13, y - 40, 18, 52, 9), { fill: "soft" });
  const names = [m.label([76, 150 + SKIN / 2 + 4], "piel", { anchor: "end" }), m.label([76, 150 + SKIN + (FAT - 12) / 2 + 4], "grasa", { anchor: "end" }), m.label([76, 150 + SKIN + FAT - 12 + 20], "músculo", { anchor: "end" })];
  return { cut, body: [cut.svg, ...names, finger(cut.at.foldLeft, -1), finger(cut.at.foldRight, 1), ...extra(cut)] };
}

// 5. Clava: de un solo movimiento, recto, hasta el fondo.
function insert(t) {
  const lift = m.keyed(t, [[0, 1], [0.2, 1], [0.42, 0, "in"], [0.9, 0], [1, 1]]) * 26;
  return fold((cut) => {
    const [x, top] = cut.at.surface;
    const s = m.syringe([x, top + NEEDLE - lift], { needle: NEEDLE, length: 46, width: 13, pulled: DOSE, fluid: DOSE });
    return [s.svg, m.count([258, 46], "90°"), m.callout([x, top + NEEDLE], "6 mm", { dx: 54, dy: 14 })];
  }).body;
}

// 6. Empuja el émbolo hasta el fondo y cuenta hasta 10 (bucle de 12 s: los segundos son reales).
function push(t) {
  const given = m.keyed(t, [[0, 0], [0.04, 0], [0.14, 1], [0.97, 1], [1, 0]]);
  const n = t >= 0.14 && t < 0.975 ? Math.min(10, Math.floor((t - 0.14) * 12) + 1) : 0;
  return fold((cut) => {
    const [x, top] = cut.at.surface;
    const left = DOSE * (1 - given);
    const s = m.syringe([x, top + NEEDLE], { needle: NEEDLE, length: 46, width: 13, pulled: left, fluid: left });
    return [given > 0.02 ? m.patch([x, top + NEEDLE + 5], 16 * Math.cbrt(given), 11 * Math.cbrt(given)) : "", s.svg, m.arrow([x + 30, s.at.plunger[1] - 16], [x + 30, s.at.plunger[1] + 6]), m.count([254, 46], n ? `${n} s` : "10 s", n && n < 10 ? { tone: "ink" } : {})];
  }).body;
}

// 7. Saca recto, suelta el pliegue y la jeringa entera va al contenedor, sin taparla.
function away(t) {
  const drop = m.keyed(t, [[0, 0], [0.2, 0], [0.7, 1, "in"], [0.9, 1], [1, 0]]);
  const s = m.syringe([200, 96 + drop * 62], { needle: 14, length: 52, width: 12 });
  return [m.ground(236, 30, 290), s.svg, m.sharps([200, 236], 70), m.arrow([236, 60], [236, 100]), m.label([104, 120], "sin volver a tapar"), m.label([104, 138], "sin frotar")];
}

// 8. Lo que no se hace.
function never() {
  const cap = m.prop(m.box(54, 98, 12, 34, 4), { fill: "soft" }) + m.prop("M60 132v16", { fill: "none" }) + m.prop(m.box(53, 150, 14, 22, 4), { fill: "paper" });
  const two = m.prop(m.box(146, 100, 12, 46, 3), { fill: "soft" }) + m.prop(m.box(162, 100, 12, 46, 3), { fill: "soft" });
  const rub = m.prop(circle([260, 132], 20), { fill: "soft" });
  return [cap, m.forbid([60, 134], 36, "re-tapar"), two, m.forbid([160, 134], 36, "reusar"), rub, m.forbid([260, 134], 36, "frotar")];
}

const move = (fn, options) => m.animated(fn, options);
const panels = [
  m.panel({ n: 1, title: "Prepara todo", text: "Lávate las manos. Revisa que sea tu insulina, que no esté caducada y que la jeringa sea nueva y para U-100. Limpia el tapón del frasco con alcohol y deja que seque.", body: ready() }),
  m.panel({ n: 2, title: "Mete aire en el frasco", text: "Jala el émbolo hasta la marca de tu dosis para llenar la jeringa de aire. Con el frasco de pie, pincha el tapón y empuja el aire dentro: así la insulina sale sin esfuerzo.", body: move(air, { frames: 28, seconds: 5, still: 0.6 }) }),
  m.panel({ n: 3, title: "Carga tu dosis", text: "Sin sacar la aguja, voltea frasco y jeringa. Con la punta dentro del líquido, jala despacio hasta tu marca. Si hay burbujas, da golpecitos, regrésalas al frasco y vuelve a cargar.", body: move(draw, { frames: 24, seconds: 4.5, still: 0.7 }) }),
  m.panel({ n: 4, title: "Elige y rota el sitio", text: "Todo el abdomen entre costillas y cadera, dejando libres unos 5 cm alrededor del ombligo. Cada inyección va al menos a 1 cm (un dedo) de la anterior. Piel limpia y seca.", body: site() }),
  m.panel({ n: 5, title: "Levanta un pliegue y clava recto", text: "Con dos dedos levanta un pliegue suave de piel y grasa, sin apretar. Mete la aguja a 90°, de un solo movimiento y hasta el fondo: queda en la grasa, lejos del músculo.", body: move(insert, { frames: 18, seconds: 2.8, still: 0.6 }) }),
  m.panel({ n: 6, title: "Empuja y cuenta hasta 10", text: "Empuja el émbolo de forma pareja hasta el fondo. Deja la aguja dentro y cuenta despacio hasta 10 para que no se regrese la insulina.", body: move(push, { frames: 40, seconds: 12, still: 0.5 }) }),
  m.panel({ n: 7, title: "Saca recto y desecha", text: "Retira la aguja en el mismo ángulo y luego suelta el pliegue. No frotes. Tira la jeringa completa, sin volver a taparla, en un contenedor rígido para punzocortantes.", body: move(away, { frames: 16, seconds: 2.6, still: 0.5 }) }),
  m.panel({ n: "✕", kind: "dont", title: "Nunca", text: "No vuelvas a tapar la aguja (te puedes pinchar), no reutilices ni compartas jeringas, y no frotes el sitio después de inyectar.", body: never() }),
];

const dark = process.argv.includes("--dark");
writeFileSync(
  join(HERE, dark ? "insulin-syringe-dark.html" : "insulin-syringe.html"),
  m.page({
    title: "Cómo inyectar insulina en el abdomen con jeringa (adulto)",
    lede: "Con jeringa, la dosis se carga desde el frasco y se pone bajo la piel, en la capa de grasa del abdomen. La dosis es siempre la que indicó tu médico.",
    call: "Si después aparecen temblor, sudor frío, hambre intensa o confusión, puede ser azúcar baja: toma 15–20 g de azúcar rápida. Si la persona no puede tragar o no responde, llama al número de emergencias (911 en México).",
    panels,
    donts: ["No inyectes en el ombligo ni a menos de 5 cm de él, ni sobre cicatrices, lunares, moretones o bultos.", "No uses una jeringa que no corresponda a tu insulina: insulina U-100 con jeringa U-100.", "No agites el frasco con fuerza; las insulinas turbias se ruedan suavemente entre las manos.", "No mezcles dos insulinas en la misma jeringa si no te enseñaron a hacerlo.", "No cambies la dosis por tu cuenta."],
    notes: ["Con aguja de 6 mm muchos adultos no necesitan pliegue. En niños, personas delgadas o con agujas de 8 mm o más, el pliegue (o inclinar a 45°) evita llegar al músculo: pregunta a tu educador en diabetes cuál es tu caso.", "Algunas guías piden contar 5 segundos con jeringa; contar 10 es la opción más segura.", "Si notas bultos o zonas duras donde te inyectas, deja descansar esa zona y avisa a tu médico."],
    source: "Folletos de técnica con frasco y jeringa de Kaiser Permanente, NUH y NHG (Singapur, basados en FIT-SG) y recomendaciones FITTER 2025, consultados en octubre de 2026",
    lang: "es",
    theme: dark ? "dark" : "light",
  }),
);
console.log("ok");
