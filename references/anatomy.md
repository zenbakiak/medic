# Anatomy for drawing procedures

What a first-aid illustrator needs to know about the body: where the landmarks are, how proportions change with age, what is under the skin, and how to draw a body part large.

## Landmarks on the figure

`figure().at` gives these as page points. In side view the trunk points sit on the front or back surface; in front view they sit on the midline.

| Name in `at` | What it is | Used for |
|---|---|---|
| `sternum` | Lower half of the breastbone, centre of the chest | CPR compressions, chest thrusts, supporting hand in back blows |
| `xiphoid` | The tip at the bottom of the breastbone, where the ribs meet | A place to stay off: pressing here can injure the liver. Abdominal thrusts go well below it |
| `upperAbdomen` | Between the navel and the xiphoid | The fist in abdominal thrusts |
| `navel` | The belly button | Reference for thrusts ("just above") and for abdominal injection sites (about 5 cm away from it) |
| `shoulderBlades` | Between the scapulae on the upper back | Back blows |
| `lowerBack` | The small of the back | Support in sitting positions |
| `throat` | Front of the neck: larynx and trachea | Choking sign. The carotid pulse is beside it, in the groove next to the windpipe |
| `nape` | Back of the neck | Support for an infant's head; never a place to strike |
| `forehead`, `chin` | | Head tilt and chin lift |
| `mouth`, `nose` | | Rescue breaths, checking breathing, nosebleed (pinch the soft part below the bony bridge) |
| `crown` | Top of the head | |
| `upperArmNear`, `forearmNear`, `thighNear`, `shinNear` | Mid-points of the limb segments | Tourniquet placement (5–7 cm above a wound, never over elbow or knee), auto-injector (middle of the outer thigh), injection sites |
| `elbowNear`, `wristNear`, `handNear`, `kneeNear`, `ankleNear`, `toeNear` | Joints and ends | Reaching, slings, splints |

Other places worth knowing, to mark with a point offset from a landmark:
- **AED pads** (front view): one below the casualty's right collarbone, beside the breastbone; one on the casualty's left side, a hand's width below the armpit. The casualty's right is on the left of a front-view drawing.
- **Nipple line**: across the chest at about 0.75 of the trunk height. Infant compressions and chest thrusts go just below it.
- **Outer thigh** (vastus lateralis): the middle third of the thigh on its outer side. Auto-injectors go here because the muscle is large and free of major vessels.
- **Injection sites under the skin**: abdomen, outer thigh, back of the upper arm, upper outer buttock.
- **Brachial pulse** (infants): inside of the upper arm, between elbow and shoulder.

## Proportions by age

`build` changes the figure's proportions, because relative head size is what makes a figure read as an adult, a child or an infant.

| Build | Standing height | Notes for procedures |
|---|---|---|
| `adult` | about 7.4 heads | |
| `child` (1 year to puberty) | about 5 heads | Kneel to their height; one hand may be enough for compressions |
| `infant` (under 1 year) | about 3.7 heads | Large, heavy head and a short neck: support the head, keep it neutral; the tongue is large and the airway narrow, which is why over-tilting closes it |

Give an infant the same `scale` as the adult holding it: the build already makes the body small, and a smaller scale becomes unreadable in a panel.

## Under the skin

For close-up cross-sections (injections, burn depth), from the surface inward:

1. **Epidermis**: about 0.1 mm, no blood vessels.
2. **Dermis**: with the epidermis about 2 mm thick on most of the body. Holds nerve endings, hair roots, sweat glands, small vessels.
3. **Subcutaneous fat**: from a few millimetres to several centimetres. Where insulin and other subcutaneous injections go. Few nerves, slow steady absorption.
4. **Muscle**: under a thin sheet of fascia. Intramuscular injections (adrenaline auto-injector, many vaccines) go here; insulin must not, because it is absorbed too fast.

Burn depth:
- **Superficial** (first degree): epidermis only. Red, painful, no blisters; like sunburn.
- **Partial thickness** (second degree): into the dermis. Blisters, very painful, wet.
- **Full thickness** (third degree): through the dermis. White, brown or charred, leathery, and often painless because the nerve endings are destroyed. Painless does not mean mild.

Size for lay readers: the casualty's own palm with fingers is about 1% of their body surface.

## The airway

Why head position matters: in an unresponsive person lying on their back, the tongue falls against the back of the throat. Tilting the head and lifting the chin pulls it clear. Rolling onto the side (recovery position) lets the tongue and any fluid fall forward. A choking object lodges at or above the vocal cords; a blow or thrust works by driving air up from the lungs behind it, which is why thrusts point upward and why the person must lean forward for back blows.

## Circulation

Compressions squeeze the heart between the breastbone and the spine; that needs a firm surface underneath, straight arms and full release so the heart refills. Arteries bleed in spurts and bright red, veins in a steady darker flow; direct pressure works on both. A tourniquet goes between the wound and the heart.

## Drawing a close-up

When the action is small, a whole figure hides it. Draw the part large with `m.prop` paths instead, and keep a tiny whole figure in a corner only if the reader needs to know where on the body it is.

- **Forearm and hand**: `m.forearm()`, with the injured area as `m.patch()` on one of its points.
- **Abdomen from the front**: `m.abdomen()`, drawn to a centimetre scale so "5 cm from the navel" can be true.
- **Skin section**: `m.skinSection()`; give it layer thicknesses in proportion (skin 2 mm, fat 12 mm at 6 px per mm is `skin: 12, fat: 72`).
- **Head in profile**: a circle with a nose bump and a chin; show the airway as a line from the mouth down the neck if the panel is about tilt.
- **Hands on a chest**: two overlapping rounded rectangles, the heel of the lower one on the target.

Keep close-ups in the same line weight and tokens as the figures so the sheet reads as one drawing.
