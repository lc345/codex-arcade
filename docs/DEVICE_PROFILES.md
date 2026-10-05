# Device Profiles

The device profile is intentionally separate from the consent protocol. A request asks for semantic choices; a device advertises how it can render and collect them.

## Seal One

One primary button. A short press reveals or speaks details. A continuous hold approves once; releasing early does nothing. There is no destructive action attached to a quick accidental press. Denial is handled by timeout or a companion UI.

## Seal Duo

One primary seal and one separate deny button. The seal uses hold-to-approve; the secondary button denies immediately; a secondary long press can defer. This is the default Press Lab profile because it makes an unambiguous demo without requiring a screen.

## Seal Dial

A dial selects the semantic choice, then the primary seal commits it. It is suitable for M5Stack-like devices and allows a local user to choose defer or deny without multiple buttons.

## Signal grammar

| State | Light | Motion | Non-color cue |
| --- | --- | --- | --- |
| Waiting | domain color | slow breathing | card and spoken summary available |
| High risk | amber warning halo | faster double pulse | explicit hold duration |
| Holding | action color | ring fills continuously | countdown text/haptic tick |
| Succeeded | green | one completion pulse | executor receipt |
| Denied | muted red | inward fade | denial receipt |
| Expired | neutral | fade to dark | expiry receipt |

Never make color alone signal the meaning of an action. A presenter should also provide text, audio, haptic feedback, or distinct motion.
