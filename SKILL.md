---
name: medic
description: Build clear, medically correct, animated step-by-step illustrations of first-aid and basic medical procedures (choking manoeuvres, CPR and AED, recovery position, bleeding control and tourniquets, burn care, nosebleeds, fractures and sprains, seizures, stroke and heart-attack recognition, anaphylaxis auto-injectors, insulin and other injections, wound cleaning, hand washing) as a standalone HTML sheet of numbered SVG panels with posable human figures that move through the action in a loop (the blow landing, the chest being pressed at the right rate, the needle going in), targets on the right body landmark, movement arrows, counts, a "call emergency" banner and a do-not list. Use this whenever someone wants a first-aid poster, a safety card, a patient or caregiver handout, an illustrated "how to" for something done to a human body, a procedure infographic or training material, or asks to explain, show or draw how to help someone who is choking, bleeding, burned, unconscious or injured, in any language, even if they never say "illustration". Prefer it over `anatomy` when the subject is a person and what to do to them; use `anatomy` when the subject is a device or mechanism.
---

# Medic

This skill makes instruction sheets like the card in an aircraft seat pocket or the poster beside a defibrillator: a few numbered panels, each showing one action on a simple human figure, with the exact spot marked, the movement drawn as an arrow, and the number that matters (×5, 30 : 2, 20 min) set large. Someone should be able to follow it while frightened, in poor light, without reading the paragraph underneath.

The reader may act on what you draw, on a real person. That is why the order of work below puts the protocol before the drawing, and why a wrong detail (hands on the wrong part of the chest, ice on a burn, a head tilted back in a nosebleed) is a worse failure than an ugly figure.

`examples/choking-adult.mjs` is a complete sheet with three animated panels: read it before you start, and build it with `node examples/choking-adult.mjs` to see the output.

## Workflow

1. **Pin down who and what.** The same emergency has different steps for an adult, a child, an infant under 1 year, a pregnant person, and for a lay rescuer versus a trained one. If the request does not say, draw the adult lay-rescuer version and say so in the title; mention the variants in the notes. Write in the language of the request.

2. **Get the protocol right before drawing anything.** Read the procedure in `references/procedures.md`. It gives the steps, the numbers, the body landmark for each action, the common dangerous mistakes, and when to call for help. If a web search tool is available, check the steps against the current guideline of a recognised body (ILCOR, the European Resuscitation Council, the American Heart Association, the Red Cross, the WHO, or the national body for the reader's country), because guidance is revised every few years and bodies differ on details. Where they differ, follow the one for the reader's country if you know it, and name the source and year on the sheet. If the procedure is not in the reference and you cannot verify it, say that to the user rather than drawing from memory.

   Do not illustrate things a lay sheet should not teach: anything needing a prescription decision (doses the reader would choose themselves), invasive procedures outside lay first aid (surgical airways, suturing, reducing a dislocation), or folk remedies. Show the dose mechanics of a prescribed device (how an auto-injector or insulin pen is used), not what dose to take.

3. **Write the panels as a list first.** Usually 3 to 6. For each one: the single action, the landmark it happens at (a name from `references/anatomy.md`), the movement, the count or time, and one or two sentences of text. Good sheets share a shape:
   - Panel 1 is recognition or safety: how you know this is the situation, and making the scene safe.
   - Calling the emergency number appears where the protocol puts it, as its own panel if timing matters (CPR: call first; a child who collapsed alone: 1 minute of CPR first).
   - One action per panel. If a caption needs "then", it is two panels.
   - A final panel says what to do if it does not work or the person gets worse (`kind: "warn"`).
   - The mistakes people actually make go in `donts`, and the worst one can have its own panel with `forbid` over it.

4. **Choose the view per panel.** Side view (`view: "side"`) shows almost everything: leaning, lying, kneeling, a rescuer behind or beside someone. Front view (`view: "front"`) is for left/right matters: which arm, a limb held up, FAST signs for stroke, pad positions for an AED. For work on a small area (a burn on a forearm, a fingertip, a nostril pinched shut, layers of skin) draw the body part large with `prop` paths instead of a whole figure; `references/anatomy.md` has notes on close-ups.

5. **Pose the figures from landmarks, not by eye.** `figure()` returns `at`, every joint and landmark as a point. Pose the casualty first, read the landmark (`victim.at.sternum`), then make the rescuer's hand reach it with `{ to: point }`. This is what keeps the hand on the lower half of the breastbone rather than somewhere on the chest. Use tone `"a"` (light) for the casualty and `"b"` (grey) for the rescuer in every panel, so the reader never has to work out who is who. Light the acting limb with `lit`.

6. **Mark the action.** One `target` on the spot, one `arrow` for the movement (`repeat: true` for a repeated one, `both: true` for push-and-release), one `count` for the number. A `callout` of two to four words only where the spot needs a name. More marks than that and the panel stops being readable at a glance.

7. **Animate the action.** A panel whose step is a movement should move: wrap its drawing in `m.animated((t) => […], { frames, seconds, still })` and drive the pose from `t` with `m.keyed`. Motion is part of the instruction, so make it true:
   - **Rate.** A loop takes as long as the real action: one compression every 0.55 s (about 110 a minute), a 10-second hold over 10 seconds with the count ticking. Readers copy the rhythm they see.
   - **Shape.** A blow or a thrust accelerates into the body (`"in"`), pauses, and comes back slower (`"out"`). A compression goes down and comes fully back up. A hold stays still.
   - **Only the acting parts move**, plus what they move (the chest under the hands, the fluid leaving a pen). Keep the target, the count and the labels fixed so the eye has an anchor; an arrow can stay as the still-frame cue.
   - **`still`** is the moment shown in print and to readers who ask for reduced motion: pick the one that best shows the action (hand on the back, chest pressed, needle in), not the rest position.
   - Recognition, positioning and "do not" panels are usually better still. Three or four moving panels on a sheet is plenty.

8. **Build the sheet** with `panel()` and `page()`, including the `call` line, the `donts`, any `notes` (variants, aftercare) and the `source`. The page adds a short "educational material" line itself; leave it there.

9. **Look at it.** Run `scripts/shot.sh page.html out.png [width] [height]` and read the PNG (default 900 × 1400 fits four panels; allow about 330 px more per extra row). Then check, panel by panel:
   - Does the hand land on the landmark the protocol names? Is the arrow pointing the right way (inward **and upward** for abdominal thrusts, straight down for compressions)?
   - Would the panel be understood with the text covered?
   - Does any elbow or knee bend backwards? Flip that limb's `bend`.
   - Is the nearer figure drawn over the farther one where they overlap, and do a rescuer's arms pass in front of the person they hold? Reorder with `parts`.
   - Is any label cut off by the panel edge?
   - Do the numbers on the drawing match the text and the reference?
   - For each animated panel, build with `MEDIC_FREEZE=0` and again with `MEDIC_FREEZE=<the still moment>` (it draws every loop frozen at that moment) and shoot both: the rest pose and the action pose must both be right, the hand must arrive on the target, and nothing may jump between them.
   Fix and re-shoot until every answer is yes. Also build once with `theme: "dark"` if the sheet will be shown on screens.

10. **Tell the user** what the sheet covers, which guideline and year it follows, what variants it leaves out, and that it is teaching material rather than a substitute for training. If something in the protocol was uncertain or bodies disagree, say which choice you made.

## The kit

`kit/body.mjs` is one dependency-free ES module. Import it by path: `import * as m from "<skill dir>/kit/body.mjs"`.

**Angles** are compass directions on the page in degrees: 0 is up, 90 is forward (the way the figure faces), 180 is down, −90 is backward. `facing: -1` mirrors a figure to face left without changing its pose. **Lengths** are in heads: `scale` is the pixel height of an adult head (24–28 suits a 320 × 260 panel with one or two whole figures; an adult stands about 7.4 heads tall).

```js
const victim = m.figure({
  at: [150, 146],          // the hip joint, in panel px
  scale: 26, facing: 1, view: "side", build: "adult",   // build: adult | child | infant
  tone: "a",               // "a" casualty, "b" rescuer
  pose: {
    torso: 0, head: 0,     // head defaults to the torso angle
    armNear: [180, 180],   // [upper arm, forearm] angles, or
    armFar: { to: [x, y], bend: 1 },   // reach a point; flip bend if the elbow goes the wrong way
    legNear: [180, 180], legFar: [180, 180],   // [thigh, shin], or { to, bend } to place the ankle
    footNear: 90,          // optional foot direction
  },
  lit: ["armNear"],        // parts drawn in the accent colour
});
victim.svg     // the whole figure, painted far limbs → trunk → head → near limbs
victim.parts   // { armFar, legFar, torso, head, legNear, armNear }: paint them yourself to interleave two people
victim.at      // points: hip, neck, shoulder, head, crown, chin, mouth, nose, forehead, nape, throat,
               // sternum, xiphoid, upperAbdomen, navel, shoulderBlades, lowerBack,
               // elbowNear, wristNear, handNear, upperArmNear, forearmNear,
               // kneeNear, ankleNear, toeNear, thighNear, shinNear (and …Far; L / R in front view)
```

Poses worth knowing:

| Position | Pose |
|---|---|
| Standing | all defaults; hip at `floorY − (thigh + shin) × scale` (`m.BUILDS.adult`) |
| Leaning forward | `torso: 60`, `head: 80` |
| Lying on the back (supine) | `torso: -90`, legs `[90, 90]`, arms `[90, 90]`, feet `0`; hip about half a trunk width above the floor |
| Lying face down (prone) | `torso: 90`, legs `[-90, -90]` |
| Head tilted back (open airway) | `head` 20–30° further back than the torso |
| Kneeling upright | thigh `180`, shin `-90`, foot `-90`; hip one thigh above the floor |
| Sitting | thigh `90`, shin `180` |
| Front view, arm raised | `armL: [300, 350]` (L and R are left and right on the page) |

Less common options: `figure({ ghost: true })` fades a figure (a previous position), `face: false` drops the nose and eye; `count(…, { size, tone })`; `target(point, r, tone)`; `page({ disclaimer })`. `at.out`, `at.up` and `at.faceOut` are unit vectors (out of the chest, up the trunk, out of the face) for placing a hand or an arrow just off a tilted body. A `{ to }` target beyond the limb's reach prints a warning and stops short: move the figure. To lie supine with the head on the other side, flip `facing`. A sitter's hip goes one leg-thickness above the seat; `m.chair` draws the seat.

Two people in one panel: pose the casualty, then the rescuer, then list parts in paint order, farthest first. A rescuer behind someone is `rescuer legs, far arm, torso, head → victim → rescuer near arm`. A rescuer kneeling beyond a lying casualty is `rescuer legs, torso, head → victim → rescuer arms`.

Marks and props, all returning SVG strings:

| Call | Draws |
|---|---|
| `m.target(point, r)` | the ring-and-dot on a landmark |
| `m.arrow(from, to, { bow, repeat, both, dashed, tone })` | a movement arrow; `tone`: `accent`, `ok`, `water`, `ink` |
| `m.count(point, "×5")` | the big number or rate |
| `m.callout(point, "two words", { dx, dy, anchor })` | a short label with a leader line. Text grows away from the point (leftward when `dx < 0`); nothing clips it, so keep it inside the 320 px panel |
| `m.forbid(point, r, "caption")` | the red do-not sign over something, with its name underneath |
| `m.ground(y, x0, x1)` | floor, bed or table line |
| `m.prop(d, { fill, tone, dashed })`, `m.box(x, y, w, h, r)` | any outlined shape: a tap, a dressing, a chair, a phone, a close-up body part. `fill`: `paper`, `soft`, `accent`, `water`, `none` |
| `m.drops(from, to, { n, tone })` | running water or drips |
| `m.label(point, "text", { anchor, tone })` | plain small text: the name under a prop or a forbidden item |
| `m.forearm({ at, length, facing })`, `m.abdomen({ at, cm })`, `m.skinSection({ skin, fat, muscle, fold })` | close-ups (`fold` lifts a pinched skin fold); each returns `{ svg, at }` with its own landmarks |
| `m.patch(point, rx, ry, { blisters })` | an injured area on a close-up |
| `m.syringe(tip, { up, pulled, fluid })`, `m.vial(mouth, { inverted, level })` | a syringe whose plunger and contents follow `pulled` and `fluid` (0..1), and the vial it draws from |
| `m.pen(tip, { up, pressed })`, `m.sharps(base)`, `m.tap(mouth)`, `m.phone(centre)`, `m.chair(seat, facing)` | the props that keep recurring |
| `m.animated((t) => body, { frames = 16, seconds = 1.2, still = 0 })` | a looping drawing: `draw(t)` is called for `frames` moments of t in 0..1 and the page flips through them with CSS alone (no script; about 3 KB per figure per frame, so 12–16 frames for a quick action, up to 40 for a long hold) |
| `m.keyed(t, [[0, a], [0.4, b, "in"], [0.55, b], …])` | the value at time t from keyframes, easing back to the first at the end of the loop. Values can be numbers, points or whole pose objects. Ease names how it arrives: `smooth`, `linear`, `in`, `out` |
| `m.mix(a, b, u)` | blend two numbers, points or poses |
| `m.panel({ n, title, text, body, kind, width, height })` | one step; `kind`: `step`, `warn`, `dont` |
| `m.page({ title, lede, call, panels, donts, notes, source, theme, lang, columns })` | the sheet; `lang: "es"` translates the fixed headings |

Colour carries meaning, so keep it to the kit's tokens: the accent red is the action and danger, blue is water, green (`ok`) is a sign of success. Skin is never drawn in a skin colour; the two figure tones are deliberately not skin tones, so the sheet is about anyone.

## References

- `references/procedures.md`: the protocols. Steps, numbers, landmarks, mistakes and when to call, for the common first-aid situations and basic procedures. Read the entry for the procedure you are drawing, every time.
- `references/anatomy.md`: the landmarks the procedures refer to and where they are on the figure, body proportions by age, skin layers and burn depth, and how to draw close-ups.
