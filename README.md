# medic

A Claude Code skill that draws animated, step-by-step illustrations of first-aid and basic medical procedures: choking manoeuvres, CPR, bleeding control, burn care, insulin injections and more. The output is one standalone HTML sheet of numbered SVG panels, with no scripts and no dependencies.

Each panel shows one action on a simple posable figure or a close-up, with the exact spot marked, the movement looping at its real rate, and the number that matters set large. Sheets print as stills and respect reduced-motion settings.

> Sheets made with this skill are teaching material. They do not replace first-aid training or the advice of a health professional. The protocols in `references/procedures.md` were written from standard guidelines and only partly checked against current sources; have someone with clinical training review them before real use.

## Install

```sh
git clone https://github.com/zenbakiak/medic ~/.claude/skills/medic
```

Then ask Claude Code for a sheet, or call it directly:

```
/medic how to help a choking infant
/medic crear un diagrama animado sobre cómo tratar una quemadura
```

## What is inside

| Path | What it is |
|---|---|
| `SKILL.md` | The workflow Claude follows: protocol first, then panels, poses, marks, motion and a visual check. |
| `kit/body.mjs` | The drawing kit, one dependency-free ES module: posable adult, child and infant figures, body landmarks, close-ups (forearm, abdomen, skin section), props (syringe, vial, pen, sharps bin, tap, phone, chair), marks, looping animation and the page. |
| `references/procedures.md` | 21 protocols written for drawing, with the points where guideline bodies differ marked "Varies". |
| `references/anatomy.md` | Landmarks, proportions by age, skin layers and burn depth, and how to draw close-ups. |
| `examples/` | Three complete sheets: adult choking, insulin by pen, insulin by syringe (the last two in Spanish). |
| `scripts/shot.sh` | Screenshots a built sheet with headless Chrome. |

## Build the examples

Needs Node 18 or later.

```sh
node examples/choking-adult.mjs      # writes examples/choking-adult.html
node examples/insulin-syringe.mjs --dark
MEDIC_FREEZE=0.5 node examples/choking-adult.mjs   # every loop frozen at one moment, for checking a pose
scripts/shot.sh examples/choking-adult.html out.png
```
