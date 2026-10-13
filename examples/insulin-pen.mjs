// Inyección de insulina en el abdomen con pluma. node insulin-pen.mjs [--dark] → insulin-pen.html
import { writeFileSync } from "node:fs";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as m from "../kit/body.mjs";
const HERE = dirname(fileURLToPath(import.meta.url));

const MM = 6; // px por milímetro en los cortes de piel
const SKIN = 2 * MM, FAT = 12 * MM, NEEDLE = 4 * MM;
const circle = ([x, y], r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

// 1. Manos limpias, aguja nueva y purga: 2 unidades con la aguja hacia arriba hasta ver una gota.
function prime() {
  return m.animated(primeAt, { frames: 16, seconds: 2.4, still: 0.5 });
}
function primeAt(t) {
  const push = m.keyed(t, [[0, 0], [0.25, 0], [0.45, 1, "in"], [0.8, 1], [0.95, 0]]); // 1 = botón a fondo, gota fuera
  const pen = m.pen([150, 78], { up: true, length: 120, pressed: push > 0.5 });
  const rise = 16 * push;
  const drop = push > 0.15 ? m.prop(`M150 ${70 - rise}q7 10 0 15q-7 -5 0 -15Z`, { fill: "water", tone: "mid" }) : "";
  return [pen.svg, drop, m.arrow([150, 46], [150, 24], { tone: "water" }), m.count([236, 70], "2 U"), m.callout(pen.at.hub, "aguja nueva", { dx: -44, dy: -8 }), m.callout(pen.at.button, "gira y presiona", { dx: 40, dy: -6 })];
}

// 2. La zona: todo el abdomen entre las costillas y la cadera, salvo 5 cm alrededor del ombligo.
function zone() {
  const belly = m.abdomen({ at: [160, 138] });
  const cm = belly.cm;
  const [x, y] = belly.at.navel;
  return [
    belly.svg,
    m.prop(m.box(x - 12.4 * cm, y - 7 * cm, 24.8 * cm, 13.5 * cm, 4 * cm), { fill: "ok", tone: "ok" }),
    m.prop(circle([x, y], 5 * cm), { fill: "paper", tone: "accent", dashed: true }),
    m.prop(`M${x - 0.7 * cm} ${y - 0.3 * cm}q${0.7 * cm} ${cm} ${1.4 * cm} 0`, { fill: "none" }),
    m.arrow([x + 4, y + 12], [x + 5 * cm * 0.7, y + 5 * cm * 0.7], { tone: "ink" }),
    m.label([x + 5 * cm + 8, y + 5 * cm + 2], "5 cm", { tone: "accent", anchor: "start" }),
    m.callout([x - 9 * cm, y - 2 * cm], "aquí sí", { dx: -22, dy: -62, anchor: "start" }),
  ];
}

// 3. Rotar: un cuadrante por semana, en el sentido del reloj, y cada pinchazo a 1 cm del anterior.
function rotate() {
  const belly = m.abdomen({ at: [160, 138] });
  const cm = belly.cm;
  const [x, y] = belly.at.navel;
  const spots = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) spots.push(`<circle cx="${x - 10.5 * cm + col * 1.5 * cm}" cy="${y - 6.4 * cm + row * 1.5 * cm}" r="1.8"/>`);
  const quarter = (dx, dy, n) => m.count([x + dx * 8.6 * cm, y + dy * 4.4 * cm + 7], String(n), { tone: "ink", size: 17 });
  return [
    belly.svg,
    m.prop(`M${x} ${y - 7 * cm}V${y + 6.5 * cm}M${x - 12.4 * cm} ${y}H${x + 12.4 * cm}`, { fill: "none", tone: "mid", dashed: true }),
    m.prop(circle([x, y], 5 * cm), { fill: "paper", tone: "accent", dashed: true }),
    m.prop(`M${x - 0.7 * cm} ${y - 0.3 * cm}q${0.7 * cm} ${cm} ${1.4 * cm} 0`, { fill: "none" }),
    `<g data-tone="accent">${spots.join("").replaceAll("<circle", '<circle class="mp-dot"')}</g>`,
    m.count([x - 8.6 * cm, y - 0.6 * cm], "1", { tone: "ink", size: 17 }), quarter(1, -1, 2), quarter(1, 1, 3), quarter(-1, 1, 4),
    m.arrow([x - 3 * cm, y - 8.6 * cm], [x + 6 * cm, y - 8.2 * cm], { bow: -14 }),
    m.callout([x - 10.5 * cm + 0.75 * cm, y - 6.4 * cm], "1 cm entre puntos", { dx: 20, dy: -52, anchor: "start" }),
  ];
}

// 4 y 5. Corte de la piel: la aguja de 4 mm entra recta y termina en la grasa, no en el músculo.
function section(pressed) {
  // paso 4: la pluma baja y la aguja entra (2,6 s). paso 5: botón, y 10 segundos reales contando.
  return pressed ? m.animated((t) => sectionAt(true, t), { frames: 40, seconds: 12, still: 0.5 }) : m.animated((t) => sectionAt(false, t), { frames: 18, seconds: 2.6, still: 0.6 });
}
function sectionAt(pressed, t) {
  const lift = pressed ? 0 : m.keyed(t, [[0, 1], [0.15, 1], [0.5, 0], [0.9, 0], [1, 1]]) * 22; // px sobre la piel
  const given = pressed ? m.keyed(t, [[0, 0], [0.04, 0], [0.14, 1], [0.97, 1], [1, 0]]) : 0; // dosis entregada 0..1
  const counting = pressed && t >= 0.14 && t < 0.975 ? Math.min(10, Math.floor(((t - 0.14) * 12) / 1) + 1) : 0; // 12 s de bucle
  const cut = m.skinSection({ x: 84, y: 118, width: 208, skin: SKIN, fat: FAT, muscle: 36 });
  const [x, top] = cut.at.surface;
  const pen = m.pen([x, top + NEEDLE - lift], { needle: NEEDLE, length: 74, pressed: given > 0.6 });
  const names = [m.label([76, top + SKIN / 2 + 4], "piel", { anchor: "end" }), m.label([76, top + SKIN + FAT / 2 + 4], "grasa", { anchor: "end" }), m.label([76, top + SKIN + FAT + 22], "músculo", { anchor: "end" })];
  if (!pressed) return [cut.svg, ...names, pen.svg, m.prop(`M${x + 10} ${top}v-12h12`, { fill: "none", tone: "accent" }), m.count([250, 62], "90°"), m.callout([x, top + NEEDLE], "4 mm", { dx: 46, dy: 22 })];
  return [cut.svg, ...names, given > 0.02 ? m.patch([x, top + NEEDLE + 6], 17 * Math.cbrt(given), 12 * Math.cbrt(given)) : "", pen.svg, m.arrow([x + 36, pen.at.button[1] - 4], [x + 12, pen.at.button[1] + 6], { bow: 6 }), m.count([240, 70], counting ? `${counting} s` : "10 s", counting && counting < 10 ? { tone: "ink" } : {}), m.callout([x + 12, top + NEEDLE + 8], "insulina", { dx: 40, dy: 22 })];
}

// 6. Sacar recto, no frotar, y la aguja al contenedor.
function finish() {
  const needle = m.prop(m.box(214, 86, 12, 22, 3), { fill: "soft" }) + m.prop("M220 108v14", { fill: "none" });
  return [m.ground(232, 30, 290), m.prop(circle([92, 128], 26), { fill: "soft" }), m.arrow([64, 150], [120, 150], { both: true, tone: "ink", bow: 10 }), m.forbid([92, 128], 40, "no frotes"), needle, m.arrow([220, 126], [220, 152]), m.sharps([220, 232], 62), m.label([220, 74], "aguja usada")];
}

const panels = [
  m.panel({ n: 1, title: "Prepara y purga la pluma", text: "Lávate las manos. Revisa que sea tu insulina y que no esté caducada. Pon una aguja nueva, marca 2 unidades y presiona con la aguja hacia arriba hasta ver una gota.", body: prime() }),
  m.panel({ n: 2, title: "Elige el sitio en el abdomen", text: "Sirve toda la zona entre las costillas y la cadera, hasta los costados, dejando libres unos 5 cm (dos o tres dedos) alrededor del ombligo. Piel limpia y seca.", body: zone() }),
  m.panel({ n: 3, title: "Rota el sitio cada vez", text: "Divide el abdomen en cuatro partes y usa una por semana, girando como el reloj. Dentro de ella, cada inyección va al menos a 1 cm (un dedo) de la anterior.", body: rotate() }),
  m.panel({ n: 4, title: "Marca tu dosis y clava recto", text: "Gira el selector hasta la dosis que te recetaron. Apoya la pluma a 90° y mete la aguja de 4 mm hasta el fondo: cruza la piel y queda en la grasa, sin llegar al músculo.", body: section(false) }),
  m.panel({ n: 5, title: "Presiona y cuenta hasta 10", text: "Aprieta el botón hasta el fondo, hasta que la ventana marque 0. Mantén la aguja dentro contando despacio hasta 10 para que entre toda la dosis.", body: section(true) }),
  m.panel({ n: 6, title: "Saca recto y desecha la aguja", text: "Retira la pluma en línea recta. No frotes ni masajees el sitio. Quita la aguja y tírala en un contenedor rígido para punzocortantes.", body: finish() }),
];

const dark = process.argv.includes("--dark");
writeFileSync(
  join(HERE, dark ? "insulin-pen-dark.html" : "insulin-pen.html"),
  m.page({
    title: "Cómo inyectar insulina en el abdomen con pluma (adulto)",
    lede: "La insulina se pone bajo la piel, en la capa de grasa. El abdomen es la zona donde se absorbe de forma más rápida y pareja.",
    call: "Si después aparecen temblor, sudor frío, hambre intensa o confusión, puede ser azúcar baja: toma 15–20 g de azúcar rápida. Si la persona no puede tragar o no responde, llama al número de emergencias (911 en México).",
    panels,
    donts: ["No inyectes en el ombligo ni a menos de 5 cm de él.", "No inyectes sobre cicatrices, lunares, moretones ni bultos bajo la piel: ahí la insulina se absorbe de forma irregular.", "No reutilices agujas ni compartas la pluma.", "No inyectes a través de la ropa.", "No cambies la dosis por tu cuenta: la dosis la indica tu médico."],
    notes: ["Con agujas de más de 4 mm, o en niños y personas muy delgadas, puede hacer falta un pliegue de piel o inclinar la pluma a 45°: pregunta a tu educador en diabetes.", "El instructivo de tu pluma puede indicar un conteo distinto (por ejemplo 6 segundos): sigue el de tu pluma.", "Si notas bultos o zonas duras donde te inyectas, deja descansar esa zona y avisa a tu médico."],
    source: "Recomendaciones FITTER (Mayo Clinic Proceedings; actualización 2025: agujas de 4 mm, rotación, un solo uso) y técnica habitual de las guías FIT; ángulo, conteo y distancias no fueron cotejados contra el texto completo",
    lang: "es",
    theme: dark ? "dark" : "light",
  }),
);
console.log("ok");
