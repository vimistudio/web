# Vimi Client Journey redesign (PR 3, stacked on #87)

- [x] 1. Foundation: tokens (globals.css + tailwind) + Instrument fonts, migrate portal literals
- [x] 2. Per-client accent: migration + accent picker in admin forms + inject --accent in portal
- [x] 3. Client home hero + needs-you banner + board cards + segmented toggle + desktop empty state
- [x] 4. Peak-End celebration modal on client approve + shared fireConfetti() + rating via comment
- [x] 5. Intake wizard polish + review header/action bar polish
- [x] 6. Skeletons match new layouts + light client desktop header + consistency sweep

Verify: npx tsc --noEmit clean; npm run build clean. Both pass.

## Deliberate skips (fictional prototype content not implemented)
- Sofía designer presence / "Online now" / avatar sidebar — fabricated persona.
- Monthly slots meter, "queue position #2", "next slot opens Friday" — fabricated.
- Per-card progress % bar — no real progress data; kept honest "in the works" pulse.
- no-access / linking gate splash screens keep their dark branded look (out of scope,
  not the client desktop header).
