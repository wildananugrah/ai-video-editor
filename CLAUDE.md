# Edit Video by Prompt

The user records talking-head videos (mostly Bahasa Indonesia) and directs edits by chat:
"00:12–00:16, keyword 'FULL YAPPING' on the left". You turn each prompt into a few lines in
`projects/<name>/edit.json`. **Do not write component code for an ordinary prompt.** Only add a
new piece type when nothing below can do it (then it's reusable: add it to `src/pieces/index.ts`
and to the table here).

Design: `docs/superpowers/specs/2026-11-03-edit-video-by-prompt-design.md`.

## Token rules

- Read only the transcript lines you need: `npm run -s srt -- <p> --from 00:10 --to 00:20` (add `--words` for word timings). Don't open whole SRT/JSON files.
- Orient with `npm run -s check -- <p> --list` instead of reading edit.json in full.
- After editing edit.json, always `npm run -s check -- <p>`. It catches bad props, times and missing files without rendering.
- Look at frames only when placement matters: `npm run -s still -- <p> 00:12.5 [more times] --scale 0.3`. Several stills → stitch with `ffmpeg … hstack` and view once.
- Never read video files or `transcript.json`.

## Workflow

1. **Ingest:** `npm run ingest -- <video> <project>` copies the original, makes a CFR H.264 working copy, detects pauses and transcribes (whisper.cpp large-v3-turbo, `id`). Report the low-confidence words it prints and ask the user about them. Extra takes: `--append`.
2. **Cut pass** (times in the ORIGINAL until the first cut; `cuts` commands use edited time):
   - `npm run -s cuts -- propose <p>` → shows what the silence pass would remove. `silence <p>` applies it (`--max-gap 0.6 --pad 0.15`, `--noise -30` for noisy rooms).
   - Bad takes / tangents: read the transcript, find restarts ("jadi, jadi, eh salah"), propose them to the user with times and text, then `cuts -- remove <p> <from> <to>` (edited time, snaps to word edges). `trim <p> --start t --end t`. `list <p>`. `reset <p>`.
   - `npm run -s cut-preview -- <p>` → `out/cut-preview.mp4` (720p, fast) and `transcript.edited.srt`.
3. **Graphics pass:** prompt times are EDITED-video time (= `transcript.edited.srt`). Add entries to `edit.json`, `check`, maybe `still`.
4. If cuts change after graphics exist: `npm run -s recut -- <p>` moves graphics with their words (lists any whose footage was cut).
5. **Render:** `npm run render -- <p> --preview` (half-res) / `npm run render -- <p>` (final, source size). `--from/--to` renders a section. Output in `projects/<p>/out/`.

Say which clock (original vs edited) you're using when the user's time could be either.

## edit.json

```jsonc
{
  "style": "clean",                                     // "collage" (default) or "clean"
  "accent": "#FFE600",                                  // clean only: override the accent (default yellow)
  "width": 1080, "height": 1920, "fps": 30,           // from the source; don't change
  "sources": [{"id": "s1", "file": "source/s1.mp4", "original": "...", "durationInSeconds": 27.1}],
  "cuts": [{"source": "s1", "from": 0.08, "to": 1.18}],  // kept pieces, SOURCE seconds; managed by `cuts`
  "entries": [                                          // EDITED time, "mm:ss.s"
    {"type": "keyword", "from": "00:12.0", "to": "00:16.0", "text": "FULL\nYAPPING", "highlight": ["YAPPING"]}
  ]
}
```

Entries render in listed order (later = on top), except `scene` which always sits under other overlays.
User files go in `projects/<p>/assets/`; `src` props are relative to the project folder.

## Styles

Each project picks one with `"style"` in edit.json. Entries are identical in both, so switching style is a one-line change.

- **collage** (default): paper/ink/yellow, Barlow/Archivo/Newsreader/Courier/Caveat, tape, stamps, tilt, 6 fps jitter, grain. Tokens: `src/theme.ts`.
- **clean** (corporate): Inter, card-colour (#FBFAF4) cards, ink frosted headline boxes, the house palette (accent = yellow, markers = marker red, `solution`/`normal` for success/info; text on yellow is ink), smooth eased motion, no tilt/jitter/grain. Tokens: `src/themes-clean.ts`. Clean variants of keyword/card/spectrum/stamp(→pill)/tape(→pill label)/quote/note(→callout)/caption live in `src/pieces/clean/`; the other pieces adapt in place via `useStyleName()`. Colour names from collage map over (`yellow`→accent, `red`→danger, `solution`→success).

When adding a piece, make it look right in both styles.

## Pieces

Common placement props (most pieces): `position` (`center left right top bottom top-left top-right bottom-left bottom-right`), or `x`/`y` (0–1 centre point, overrides position), `size` (scale, 1 = default), `tilt` (deg).
In vertical frames (9:16, 4:5) `left`→`top`, `right`→`bottom` automatically; content stays inside the platform-safe area.
Colours accept theme names (`paper ink yellow red card solution normal white`) or CSS colours.

| type | what | key props |
|---|---|---|
| `keyword` | Barlow 900 words on ink/yellow strips, each word appears as it's spoken | `text` ("\n" = new strip), `highlight` [words], `sync` (default true) |
| `card` | taped paper card | `label`, `title`, `bullets` [], `accent` |
| `spectrum` | tape scale with end labels, sliding marker | `left`, `right`, `center`, `marker` 0–1, `markerTo` |
| `split` | speaker on one half, panel with child pieces on the other (top/bottom when vertical) | `side` (speaker side, left/right), `panel` paper/ink/yellow/halftone, `focusX`, `children` |
| `scene` | full-screen collage replacing the footage | `background`, `speaker` badge/cutout/none, `speakerSrc`, `speakerPosition`, `speakerSize`, `focusX/Y`, `children` |
| `zoom` | punch-in / slow push on the footage | `scale` (1.25), `x`,`y` (zoom centre), `style` punch/push |
| `image` | user image or B-roll: `full` cutaway or taped `inset` | `src`, `mode`, `width` (0–1), `treatment` none/bw, `audio`, `startAt`, `fit` |
| `sticker` | collage: B&W cut-out, white outline, yellow halftone block. clean: photo with rounded corners + shadow | `src` (collage: must be a `-sticker.png` from `npm run sticker -- <p> <image>`), `width`, `block` |
| `stamp` | red rubber stamp slams in | `text`, `color` |
| `marker` | hand-drawn stroke draws on | `shape` circle/underline/scribble/arrow/cross/box, `x y w h` (0–1, centre + size), `color`, `stroke` |
| `highlight` | yellow highlighter swipe | `x y w h`, `color` |
| `badge` | round live crop of the speaker | `diameter` (0.26), `focusX`, `focusY`, `zoom`, `ring` |
| `quote` | Newsreader italic on a card | `text`, `author` |
| `note` | Caveat Brush handwriting writes on | `text`, `color` |
| `caption` | spoken words, a few at a time, current word highlighted (only when asked) | `wordsPerLine`, `style` box/plain |
| `tape` | small Courier label on tape | `text` |
| `lowerthird` | name bar (bottom-left) | `name`, `role` |
| `sfx` | sound effect | `sound`: whoosh pop stamp click riser ding, or a project file; `volume` |
| `fade` | fade whole frame | `direction` in/out, `color` |

`children` (split/scene): `[{ "type": "...", "delay": 0.5, "duration": 2, ...props }]`. They share the parent's time; `delay`/`duration` in seconds. Child positions are relative to the panel.

Texture (jitter, grain, vignette) follows the project style automatically.

## Setup / environment

- `npm run setup` once: whisper.cpp + model (`.whisper/`), Python env for stickers (`.venv/`, rembg `isnet-general-use`), built-in SFX.
- Rendering uses the installed Google Chrome (`scripts/config.ts`, `remotion.config.ts`): Remotion's downloaded headless shell crashes on this macOS.
- `npm run studio` opens Remotion Studio (set the `project` prop).
- `npm test` (time/cut maths), `npm run typecheck`.
