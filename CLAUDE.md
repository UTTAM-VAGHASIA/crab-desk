# Crab desk: guide for coding agents

A Claude Code mod (a plugin with a hooks module) that draws a side pane, "the desk".
What it shows is in `README.md`. This file holds what the code does not tell you.

## Working with the owner

- Commit and push only when the owner says so, each time.
- The owner tests by restarting his session and looking. Say plainly what you could
  not see live; a unit test passing is not the pane working.
- Explain in plain words. He is not reading the code.

## Releasing a change

The app runs a cached copy, so nothing shows until a release (steps in `README.md`).
Three traps:

- A release under an unchanged `version` is silently skipped. Always raise it.
- After `claude plugin update`, confirm the cache got it:
  `cmp hooks/register.js ~/.claude/plugins/cache/uttam-mods/crab-desk/<version>/hooks/register.js`.
- A running session keeps the old code until it is restarted.

## Checks

The four commands in `README.md`. The type-check has ten known errors (two are
`toBase64`); an eleventh is yours. `dev/pure.test.mjs` evaluates only the code between
`// >>> name` and `// <<< name` marks in `register.js`, so keep pure logic inside a
marked region and add its cases there.

## What the mod validator refuses

- `$` passed anywhere but to a top-level function. A closure may call a top-level
  function with `$`.
- `key` on anything but Box, Button or Raster; `onPress` on anything but Button.
- Fractional absolute offsets.
- An Svg without `alt`, or with a source over 131072 characters. An Svg is drawn as
  an image: only CSS animation moves, and it takes no press.

## Two drawings, one file

`ui.render` for the Pane has two branches, and a section added to one is not in the
other until you add it there too:

- **Desktop app:** `deskSheet()` builds cards as SVG pictures. A native Button is laid
  over a picture by an absolute Box, counted in cells from the picture's right edge and
  its top or bottom: a column is 8 px, a row about 19 px. A button's own shape is its
  word plus 10 px each side, 22 px tall; the picture draws a chip of that size under
  it. A block with buttons (`over`) becomes its own picture. Place buttons a row or
  two from an edge, because the row estimate drifts with distance.
- **Terminal:** the same sections in cells, after the desktop branch returns. It
  redraws twice a second while anything works, so motion there is drawn frame by
  frame; the desktop's motion is CSS and needs no redraw.

Desktop redraws are throttled (2 s after a change, 5 s for clocks while busy, 30 s
idle) and frozen while a held command waits, because each redraw replaces the buttons
and a click on a replaced button is lost.

The owner would like the file split into shared logic, the desktop sheet and the
terminal sheet, both built from one list of sections. Not started; first confirm a
hooks module may import sibling files.

## Facts found the hard way

- The desktop app counts as a headless session: `$.session.compact` is refused there.
  The mod falls back to `$.command.run({ command: 'compact' })`, which works.
- Usage read straight after a compaction is 0, not the real size.
- `$.model.complete` takes a model alias (`opus`, `sonnet`, `haiku`) and an effort.
  `$.model.fork` sees the whole transcript but cannot choose model or effort.
- State that must outlast a session goes in `$.store`, keyed by `$.session.id()`
  (`ready:<id>`, `team:<id>`); `seen` and `known` are shared by all sessions.
- A docked terminal pane cannot be made full height; the engine places it.
- Tools the mod registers are named `mcp__crab-desk__<name>`.
- The mod was called clawd-desk until 0.11.0. It was renamed because Anthropic has
  asked another project to drop "Clawd" from its name. In the interface the character
  is still called Clawd.

## Heads up

The watcher's rules are our own words. Claude Code's built-in "You should know" was
read for comparison (its text sits inside the `claude` binary); nothing was copied,
and nothing from it may be.

## Not yet seen live

- The four buttons on a Heads up note, and Chat filling the prompt box.
- The last group of helpers reappearing after a session is reopened.
- Anything at all under the new name: the rename to crab-desk was released untested.
