# Edit Video by Prompt — Design

Date: 2026-11-03

## Intent

The user records themselves talking ("yapping") on their phone, mostly in Bahasa Indonesia, and wants to turn that raw footage into an edited video with motion graphics, images, B-roll and collage effects — without opening a video editor. Reference: Agusleo Halim's "20 Menit untuk Isi Otak lo dengan CARA CUAN pakai AI di Media Sosial" (YouTube `CbLb3Pe0vhQ`), where a talking-head video gets keyword text, a spectrum bar, side cards, a split screen, zoom-ins, stamps and SFX, all made by chatting with Claude.

**The "app" is a Remotion project that Claude edits through chat.** There is no custom UI. The workflow:

1. User drops a recording into the project.
2. Claude runs a script that transcribes it locally into an SRT (Bahasa) and reports back.
3. **Cut pass.** Claude proposes cuts (silences, bad takes, tangents, start/end trim) from the transcript; the user adjusts by prompt. Claude renders a cut-only preview and writes a new SRT in edited-video time.
4. **Graphics pass.** User prompts edits by time range in the edited video, e.g. *"00:12–00:16, keyword text 'FULL YAPPING' on the left"*, *"00:30–00:35 cut to a full collage scene with this image as a sticker"*, attaching images/videos as needed.
5. Claude turns each prompt into a few entries in a timeline file, optionally checks a still frame, and renders.

**Why this shape:** token cost. Most of the expense in chat-driven editing is Claude writing fresh animation code and looking at frames. So the system is built so that a typical prompt becomes a small data edit, not new code.

## Goals

- Transcribe recordings to an SRT locally (free, no tokens), accurate for Bahasa Indonesia with English words mixed in.
- Cut out silences, bad takes and tangents, and trim start/end, with Claude proposing cuts from the transcript.
- A library of reusable, parameterised graphic pieces, all in one consistent visual style.
- A single timeline file per video that fully describes the edit, so prompts become small diffs.
- Supports 9:16, 16:9 and 4:5, with pieces that rearrange for the format.
- Cheap verification: render one still at a given time instead of whole videos.
- A project guide (CLAUDE.md) so each new chat session can start editing without re-exploring the codebase.

## Non-goals

- No GUI, web app or upload screen.
- No automatic "decide what graphics to add". The user directs every edit in prompts. (Claude may suggest, but nothing is added unprompted.)
- No always-on burned-in captions. The SRT is for timing; captions appear only where the user asks for them.
- No per-video style switching. One house style.

## Anti-goals (failure even if it "works")

- Every prompt makes Claude write or rewrite component code. That defeats the point.
- Graphics land out of sync with the words. Timing must come from the SRT, not guesses.
- In vertical formats, important text hides under TikTok/Reels/Shorts UI.
- The speaker footage gets degraded (unwanted colour grading, jitter, recompression artefacts). The footage passes through as recorded unless the user asks otherwise.

## Constraints

- Machine: Apple M1 Mac. Node 25, ffmpeg and Python 3.14 are installed; Whisper isn't yet.
- Project folder is empty and not a git repo.
- Remotion (React/TypeScript).
- Fonts via `@fontsource`.

## Decided by the user

### Workflow
- Chat with Claude, who edits the project files (as in the reference video). Small helper scripts to save tokens, not a full CLI app.
- Prompts reference time ranges. The user will attach extra images/videos and describe motion graphics.
- Each prompt says whether a graphic is an overlay on the footage or a full-screen collage scene with the speaker as a cut-out or badge. Both must be supported.

### Cutting
- Edits include removing silences, bad takes and tangents, and trimming the start and end.

### Formats and size
- Recordings can be 9:16, 16:9 or 4:5. Each format is recorded separately, so every project renders in its source's own format. No cross-format reframing.
- Typical sources: 1–3 min at 720p/1080p for TikTok; up to ~10 min at 720p/1080p for YouTube.

### Captions
- The SRT is only for timing. Captions are a piece the user asks for by time range.

### Visual style (consistent throughout)

- **Colours:** paper `#ECE9DF`, ink `#141414`, yellow `#FFE600`, marker red `#E4352B`, card `#FBFAF4`, solution `#22C55E`, normal `#22D3EE`
- **Fonts** (`@fontsource`):
  - Barlow Condensed 800/900 uppercase: titles, big numbers, label strips
  - Archivo 600: captions
  - Newsreader italic: quotes
  - Courier Prime: small labels / tape
  - Caveat Brush: handwriting
- **Photo treatment:** high-contrast black and white, white sticker outline, on a yellow block with a halftone pattern.
- **Collage pieces:**
  - tilted black and yellow strips, scraps of "tape", red stamps
  - red marker scribbles and circles, yellow highlighter
  - a round badge of the speaker's face
- **Texture:** subtle stop-motion jitter (6 times per second) on collage pieces, light vignette, grain.

## Decided by Claude (the user can override)

### Architecture
- **Theme module.** Colours, font roles, grain/vignette strength and the jitter rate in one file. Every piece reads from it.
- **Piece library.** Each graphic type is one Remotion component with typed props (Zod schema). All positions are semantic (`left | right | top | bottom | center`, plus optional offsets as a fraction of the frame), never raw pixels, so one entry works in every format.
- **Timeline file:** `projects/<video-name>/edit.json`. It holds:
  - `sources`: one or more recordings (normally one; multiple takes can be joined in order).
  - `cuts`: the list of kept segments `{ source, from, to }` in source time. The edited video is these segments played back to back.
  - `entries`: an ordered list of graphics `{ type, from, to, ...props }` in **edited-video time**, matching the edited SRT the user sees.
  - Times are `mm:ss.s` strings. A generic composition reads it, plays the kept segments with `<Sequence>` + `<OffthreadVideo startFrom>` and renders every entry on top. Adding an edit = adding JSON lines.
- **Which clock prompts use:** during the cut pass, original-recording time (`transcript.srt`); after it, edited-video time (`transcript.edited.srt`). Claude says which one it's using when it's ambiguous.
- **Changing cuts after graphics exist:** a `recut` script remaps every entry through source time to the new cut list. Entries whose words were cut out get flagged for the user rather than silently dropped.
- **Cut proposals:** silences come from word-timestamp gaps (default: any gap > 0.6 s gets tightened to ~0.15 s padding); bad takes come from Claude reading the transcript for repeated/restarted phrases. Claude lists proposals with timestamps and the text, and the user confirms or adjusts. Cuts snap to word boundaries with a few frames of padding and a short audio crossfade so there are no clicks.
- **Per-video folder:** `projects/<video-name>/` holds the source(s), `transcript.srt`, `transcript.json` (word-level timestamps), `transcript.edited.srt`, `edit.json`, `assets/` (user-supplied images/clips plus processed stickers) and `out/`.
- **Ingest:** phone footage is often variable-frame-rate HEVC (and HDR on iPhone). On ingest, a script makes a constant-frame-rate H.264 SDR working copy at the source resolution, which Remotion uses. The original is kept untouched.
- **CLAUDE.md** describes the piece library and its props, the `edit.json` format, the scripts, and the token-saving rules: read only the relevant SRT lines, edit JSON before code, use stills for checks.

### Scripts (npm scripts / small Node or Python files)
- `ingest <video> <project-name>`: creates the project folder, makes the working copy, then runs `transcribe`.
- `transcribe <video>`: extracts audio with ffmpeg and runs whisper.cpp locally through `@remotion/install-whisper-cpp`, with language `id` and a large-v3-class model (accuracy first; one-time model download). Writes the SRT plus word-level JSON. Words with low confidence are flagged so Claude can ask the user about them.
- `still <project> <time>`: renders one frame to PNG, which Claude views only when a check is needed.
- `render <project> [--preview]`: renders the MP4 in the source's own size and aspect ratio. `--preview` renders at half resolution for a quick check; the final render is full resolution. Expected on the M1: roughly minutes for a 1–3 min TikTok, up to ~20–40 min for a 10 min 1080p YouTube video (Remotion concurrency tuned to the machine).
- `cut-preview <project>`: renders only the cuts (no graphics) quickly with ffmpeg, and writes `transcript.edited.srt`.
- `recut <project>`: remaps entries after the cut list changes (see above).
- `sticker <image>`: background removal with `rembg` (local), then high-contrast B&W and a white outline. The output is a transparent PNG that the Photo/Sticker piece places on the yellow halftone block.

### Starting piece library
Restyled from the reference video into the house collage style, plus the collage set:

| Piece | Notes |
|---|---|
| Keyword text | Barlow 900 uppercase on tilted black/yellow strips; word-by-word reveal timed to the transcript |
| Side card | Paper card with tape, Courier label, bullet lines |
| Spectrum bar | Tape strip with marker ticks, end labels, centre label; optional moving marker |
| Split screen | Speaker on one side, paper panel on the other holding child pieces; becomes top/bottom in 9:16 and 4:5 |
| Zoom / punch-in | Scales the footage around a focus point; the speaker footage is not jittered |
| Image / B-roll insert | Inset or full-frame, with optional sticker treatment |
| Photo sticker | Output of the `sticker` script on a yellow halftone block |
| Stamp | Red rubber stamp, slams in |
| Marker | Circle / scribble / underline that draws on over a target area |
| Highlighter | Yellow swipe behind text |
| Face badge | Round, live crop of the speaker's footage |
| Quote | Newsreader italic |
| Handwriting note | Caveat Brush, writes on |
| Caption | Archivo 600 from the SRT text for the given range (on request only) |
| Collage scene | Full-screen paper background replacing the footage, with child pieces; the speaker can appear as a badge or a cut-out |
| SFX | Audio cue at a time (whoosh, pop, stamp). Files go in a shared `sfx/` folder |

New piece types get added when a prompt needs one. They become reusable from then on.

### Format behaviour
- The composition's size and fps come from the source recording.
- In 9:16 and 4:5, split screens stack vertically, keyword text stacks above or below the face, and the spectrum bar narrows.
- Vertical formats keep important content out of platform UI areas (roughly the top 12%, bottom 20% and right-side 15% for 9:16). This is a theme setting.

### Texture
- Jitter is applied by a wrapper: offset/rotation change on a 6 fps step, seeded per piece so it's deterministic across renders. It applies to collage pieces only.
- Grain and vignette are full-frame overlays at low strength.
- Default output is H.264 MP4 at the source's resolution and frame rate with high quality. Source audio is untouched apart from cut crossfades and SFX mixed in.

## Left to the builder
- The exact animation curves, timings and the visual design of each piece within the style above.
- How the speaker cut-out for collage scenes is produced (per-frame segmentation vs. a still cut-out). A still cut-out is fine to start.
- Sourcing a small starter SFX set (license-free) and the halftone/grain textures.
- Folder layout beyond what's specified, and the testing approach.

## Build notes (changes found while building)

- **Model:** `large-v3-turbo` (large-v3 accuracy class, much faster on M1).
- **Pauses come from the audio, not Whisper.** Whisper's word timings drift into pauses, so `ingest` runs ffmpeg `silencedetect`, the silence pass cuts those pauses, and words are re-aligned onto the detected speech before anything uses them.
- **Sticker treatment is baked into the PNG** by `npm run sticker`. Doing it with CSS filters made renders ~5× slower; `check` rejects stickers that weren't processed.
- **Rendering uses the installed Google Chrome**: Remotion's downloaded headless shell crashes on this macOS version.
- Measured on the M1: about 3.5–4× real time at full resolution (≈30–40 min for 10 min of 1080p).
