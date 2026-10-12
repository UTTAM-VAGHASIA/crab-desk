# Clawd desk

A Claude Code mod: a sidebar with Clawd and what he is saying, his plan, the team of
helpers, the turn's files and edits, project progress, usage, a watcher's notes
("Heads up"), a hold on risky commands, and a Compact button. It draws in the desktop
app and in the terminal. Open it with `/desk`.

A mod runs with your full permissions and is not sandboxed.

## Layout

- `hooks/register.js`: the whole mod.
- `.claude-plugin/`: the plugin's name and version, and the one-plugin marketplace
  (`uttam-mods`) it installs from.
- `dev/`: its tests and preview tools. They are not part of the mod.

## Install

```bash
claude plugin marketplace add ~/.claude/mods/clawd-desk
claude plugin install clawd-desk@uttam-mods --scope user
```

## Change it

The app runs a cached copy, so an edit shows only after a release:

1. Edit `hooks/register.js`.
2. Run the checks below.
3. Raise `version` in `.claude-plugin/plugin.json`.
4. `claude plugin marketplace update uttam-mods`, then
   `claude plugin update clawd-desk@uttam-mods`.
5. Restart the session. `/reload-plugins` does not swap a running mod.

## Checks

```bash
node --check hooks/register.js
node dev/pure.test.mjs
npx -y -p typescript tsc -p . --noEmit --allowJs --checkJs --noImplicitAny false
claude plugin validate .
```

The type-check reports nine known errors that do no harm; a tenth is a new one.
`node dev/preview.mjs` writes the desk's cards as HTML pages into `dev/`, to look at in
a browser in dark and light.
