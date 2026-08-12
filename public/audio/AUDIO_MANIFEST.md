# Audio asset manifest (Milestone 7)

No licensed audio files are in the repo yet. The runtime uses generated
placeholders (quiet pad + filtered noise ambience + short SFX) until these
files are supplied. Drop originals / royalty-free / public-domain tracks
at the paths below — **do not use LOTR or other copyrighted scores**.

| Slot | Path | Format | Notes |
| --- | --- | --- | --- |
| Exploration music | `public/audio/music/exploration-theme.mp3` | MP3, loopable | Active exploration soundtrack. |
| Campfire ambience | `public/audio/ambience/campfire.ogg` | Ogg, seamless loop | Quiet crackle. Very low mix. |
| Shire ambience | `public/audio/ambience/shire.ogg` | Ogg, seamless loop | Soft breeze / nature. |
| Mountains ambience | `public/audio/ambience/mountains.ogg` | Ogg, seamless loop | Low wind / airy. |
| Mordor ambience | `public/audio/ambience/mordor.ogg` | Ogg, seamless loop | Distant rumble / embers. |
| Interact SFX | `public/audio/sfx/interact.ogg` | Ogg, <0.4s | Soft UI click / chime. |
| Encounter SFX | `public/audio/sfx/encounter-whoosh.ogg` | Ogg, ~0.5–0.7s | Magical sweep / whoosh. |

After dropping files, set `AUDIO_USE_FILES` to `true` in
`src/game/audio/audioCatalog.ts` for ambience/SFX. Exploration music
already loads from `public/audio/music/exploration-theme.mp3`.

Until ambience/SFX files exist, those buses use generated fallbacks.