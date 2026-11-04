# AI Video Editor

Edit talking-head videos by chatting, with no video editor needed. Record yourself on your phone, drop the file in, and describe the edits in plain words. For example: *"cut the silences"*, *"00:12–00:16 keyword FULL YAPPING on the left"* or *"split screen with this image at 00:30"*. [Claude Code](https://claude.com/claude-code) turns each prompt into a few lines in a timeline file, and [Remotion](https://www.remotion.dev) renders the video.

- **Transcription on your machine** (whisper.cpp, tuned for Bahasa Indonesia). It writes an SRT with word timings, so graphics appear right when you say the words.
- **Cutting:** removes silences automatically, plus bad takes, tangents and trims on request. Graphics follow their words when the cuts change.
- **23 motion-graphic pieces:** keyword text, cards, split screen, zoom, images and B-roll, stickers, stamps, markers, captions, name bars, count-up stats, diagrams, step trackers, sound effects and more.
- **Two styles:** `collage` (paper, tape and stamps with a stop-motion feel) and `clean` (corporate cards and smooth motion), both in one shared palette.
- **Any format:** 9:16, 16:9 and 4:5. Layouts rearrange for vertical video and keep clear of TikTok/Reels buttons.

## Requirements

Tested on macOS (Apple Silicon).

| Tool | Why | Install |
|---|---|---|
| Node.js 20+ | Remotion and the scripts | `brew install node` |
| ffmpeg | video and audio processing | `brew install ffmpeg` |
| cmake + git | building whisper.cpp | `brew install cmake git` |
| Python 3 | background removal for stickers | `brew install python` |
| Google Chrome | rendering (Remotion's own headless browser crashes on recent macOS) | [google.com/chrome](https://www.google.com/chrome/) |
| Claude Code | the "by prompt" part | [claude.com/claude-code](https://claude.com/claude-code) |

## Setup

```bash
git clone https://github.com/wildananugrah/ai-video-editor.git
cd ai-video-editor
npm install
npm run setup
```

`npm run setup` runs once. It builds whisper.cpp and downloads the `large-v3-turbo` model (about 1.6 GB, into `.whisper/`), creates a Python environment for stickers (`.venv/`, about 170 MB model), and generates the built-in sound effects.

## Using it with Claude Code

Open the folder in Claude Code. It reads [CLAUDE.md](CLAUDE.md), which describes the workflow, the pieces and their options. Then just talk to it.

**1. Bring in a recording**

> Ingest `~/Movies/episode-1.mov` as `episode-1`, clean style.

Claude makes a working copy, transcribes it, and lists any words Whisper wasn't sure about.

**2. Cut**

> Cut the silences and any bad takes.

Claude suggests cuts (each with its time and words). Once you agree, it makes a quick cut-only preview (`out/cut-preview.mp4`) and an SRT that matches the edited video (`transcript.edited.srt`).

**3. Add graphics**

Times now refer to the **edited** video, the one in `transcript.edited.srt`.

> 00:03–00:06 keyword "EDIT VIDEO / PAKAI PROMPT", highlight PROMPT, with a whoosh.
> 00:08 punch-in zoom for 2 seconds.
> 00:10–00:14 card on the right: "Caranya" with bullets "Yapping di depan HP", "Edit lewat chat".
> 00:15–00:19 split screen, me on the left, `assets/chart.png` on the right.
> Name bar at the start: Wildan, Founder.

Put your images and B-roll clips in `projects/<name>/assets/`, or just give Claude the path.

**4. Preview and render**

> Render a preview. / Render the final video.

Output goes to `projects/<name>/out/`.

**Or let Claude plan the edit.** Ask *"analyse the transcript and suggest an edit plan"*. Claude reads the SRT and writes a plan (cuts, structure, graphics for each moment, captions and pacing notes). You adjust the plan, then it executes it.

### Styles

Say the style in your prompt ("use the clean style") or set it in `edit.json`:

```jsonc
{ "style": "clean", "accent": "#FFE600" }   // "collage" is the default
```

Both styles use the same entries, so switching a finished edit to the other style is a one-line change.

## Commands

You'll mostly let Claude run these, but they all work by hand. Times are `mm:ss.s`.

| Command | What it does |
|---|---|
| `npm run ingest -- <video> <project> [--append]` | Create a project: keep the original, make a working copy, detect pauses, transcribe. `--append` adds another take to the end. |
| `npm run transcribe -- <project> [--realign]` | Re-run transcription. `--realign` only redoes word timing. |
| `npm run srt -- <project> --from 00:10 --to 00:20 [--words] [--source]` | Print what's said in a time range (edited time by default). |
| `npm run cuts -- propose <project>` | Show what the silence pass would cut (`--max-gap 0.6 --pad 0.15 --noise -35`). |
| `npm run cuts -- silence <project>` | Apply the silence pass. |
| `npm run cuts -- remove <project> <from> <to> [--source s1]` | Cut a range of the edited video (snaps to word edges), or of the original recording with `--source`. |
| `npm run cuts -- trim <project> --start t --end t` | Trim the start and/or end. |
| `npm run cuts -- list\|reset <project>` | Show the kept segments / go back to the full recording. |
| `npm run cut-preview -- <project>` | Fast 720p preview of the cuts only, plus `transcript.edited.srt`. |
| `npm run recut -- <project>` | After the cuts change, move graphics to stay on their words. |
| `npm run check -- <project> [--list]` | Validate `edit.json` (pieces, props, times, files) without rendering. |
| `npm run still -- <project> <time> [...] [--scale 0.5]` | Render single frames to PNG. |
| `npm run render -- <project> [--preview] [--from t --to t]` | Render the MP4 (`--preview` = half resolution). |
| `npm run sticker -- <project> <image>` | Cut out a photo, make it B&W, add the white sticker outline. |
| `npm run studio` | Open Remotion Studio (set the `project` prop). |
| `npm test` / `npm run typecheck` | Tests for the time/cut maths / TypeScript check. |

## Project layout

```
projects/<name>/
  edit.json               the timeline: style, cuts, graphics (this is what prompts change)
  transcript.srt          what you said, original timing
  transcript.edited.srt   what you said, timing after cuts
  assets/                 your images, clips, stickers
  source/                 original recording + working copy
  out/                    previews, stills, final renders
projects/_shared/sfx/     built-in sound effects
src/pieces/               the graphic pieces (src/pieces/clean/ = clean-style versions)
src/theme.ts              collage style tokens
src/themes-clean.ts       clean style tokens
scripts/                  the commands above
```

A minimal `edit.json` entry:

```json
{"type": "keyword", "from": "00:12.0", "to": "00:16.0", "text": "FULL\nYAPPING", "highlight": ["YAPPING"]}
```

The full list of pieces and their options is in [CLAUDE.md](CLAUDE.md#pieces).

## Tips

- **Audio matters most.** Speak close to the phone or use a clip-on mic. If your voice is barely louder than the room noise, Whisper invents words, and nothing can be timed to your speech.
- **Turn off HDR** on iPhone (Settings → Camera → Formats → HDR Video). HDR footage is converted only approximately.
- **Render times** on an M1: about 3.5–4× the video length at full resolution, so roughly 5–10 minutes for a 1–3 minute clip and 30–40 minutes for 10 minutes of 1080p. Use `--preview` while iterating.
- Record 16:9 and 9:16 versions separately. Each video renders in its own recorded format.

## Troubleshooting

- **`Target closed` when rendering:** Remotion couldn't use the browser. Make sure Google Chrome is installed in `/Applications`, or point `REMOTION_BROWSER` to a Chrome binary.
- **`Whisper not installed`:** run `npm run setup`.
- **The silence pass cuts too much or too little:** try `--noise -30` for a noisy room, or change `--max-gap`.
- **`isn't a processed sticker`:** in the collage style, run `npm run sticker -- <project> <image>` and use the `-sticker.png` it makes.
