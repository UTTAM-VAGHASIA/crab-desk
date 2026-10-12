// Draws the desk's Desktop sheet from sample state into preview.html, beside
// this file, and one page per scheme and pair of states (view-dark-0.html ...)
// for a closer look. Everything above the hooks in register.js is evaluated
// as it stands. A native Button is placed as the app places it, from the same
// cells the mod emits: a column is 8 px, a row 19 px, counted from the
// picture's right edge and its top or bottom, as measured with /desk-lab. It
// is drawn as the app draws it: its word in the app's sans font at 14 px, the
// main one as a filled pill. A Details, Hide or Cancel button stands on the
// fill of its own box (the mod's CHIP_FILL), which is the button's own area,
// its word and 8 px to each side, 22 px tall: the picture draws no chip.
// Run: node preview.mjs [path to register.js] [width] [row px: 18, 19 or 20]
// A row other than 19 writes view-<scheme>-<n>-r<row>.html instead.
// Shoot: chrome --headless=new --hide-scrollbars --window-size=864,1500 --screenshot=view-dark-0.png file:///.../view-dark-0.html
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const modFile = process.argv[2] ?? join(here, '..', 'hooks', 'register.js')
const source = readFileSync(modFile, 'utf8')
const end = source.indexOf('// --- The hooks')
if (end < 0) throw new Error('marker not found')
const desk = new Function(
  source.slice(0, end) +
    `\nreturn { COL_PX, ROW_PX, EDGE_PX, deskSheet, lineDiff, riskOf, parseProgress, summarise, teamWith, heldLead, damageText, barsDrawn, bandOf, blockerOf, cardParts, agentBlock, headBlock, projectBlock, usageBlock, planBlock, set: (s) => {
      mood = s.mood; note = s.note; team = s.team; usage = s.usage; project = s.project; todos = s.todos; openRow = s.openRow
      branch = s.branch ?? ''; turnNow = s.turnNow ?? { edits: [], reads: [] }; turnBefore = s.turnBefore ?? { edits: [], reads: [] }
      holds = s.holds ?? []; bubble = s.bubble ?? s.note; scrolls = s.scrolls ?? {}
    }, team: () => team }`,
)()

const at = 1_800_000_000_000
const helper = (over) => ({
  effort: '', contextTokens: 0, tokens: 0, costUsd: 0, requests: 0, stepTotal: 0, stepDone: 0, stepNote: '', actions: [], outcome: '', status: 'running', ...over,
})
const verbs = ['reading verify_core.dart', 'searching for mapProblem', 'running a command: fvm dart analyze lib/src/verify --fatal-infos', 'editing problem.dart', 'looking for **/*_test.dart', 'reading progress.yaml']
const thirty = Array.from({ length: 30 }, (_, i) => ({ at: at - 300e3 + i * 9e3, text: verbs[i % verbs.length] + (i % 7 === 0 ? ' and a tail long enough that it has to be cut at the edge' : '') }))
const team = [
  helper({ id: 'f1', type: 'Plan', description: 'Plan the verify checks', model: 'claude-opus-5-5', effort: 'high', status: 'done', startedAt: at - 900e3, endedAt: at - 700e3, contextTokens: 88000, tokens: 310000, costUsd: 0.61, requests: 9, stepTotal: 4, stepDone: 4, outcome: 'done in 3:20' }),
  helper({ id: 'f2', type: 'general-purpose', description: 'Check the Windows path cases', model: 'claude-sonnet-5', effort: 'medium', status: 'done', startedAt: at - 800e3, endedAt: at - 650e3, contextTokens: 52000, tokens: 140000, costUsd: 0.21, requests: 6, outcome: 'done in 2:30' }),
  helper({ id: 'f3', type: 'general-purpose', description: 'Port the ticket reader to the new slice folders', model: 'claude-fable-5', effort: 'high', status: 'failed', startedAt: at - 500e3, endedAt: at - 380e3, contextTokens: 140000, tokens: 420000, costUsd: 1.84, requests: 12, stepTotal: 8, stepDone: 5, stepNote: 'writing tests', outcome: 'failed after 2:00: interrupted', actions: [{ at: at - 400e3, text: 'editing tickets.dart' }, { at: at - 385e3, text: 'running a command: fvm dart test test/tickets_test.dart' }] }),
  helper({ id: 'r1', type: 'Explore', description: 'Find every caller of mapProblem and say which of them still read the old shape', model: 'claude-opus-5-5', effort: 'low', startedAt: at - 304e3, contextTokens: 41000, tokens: 120000, costUsd: 0.08, requests: 5, stepTotal: 5, stepDone: 3, stepNote: 'reading lib/verify', actions: thirty }),
]
const usage = { startedAt: at - 397429e3, context: { tokens: 168000, window: 1000000 }, rateLimits: [{ kind: 'five_hour', percentUsed: 37 }, { kind: 'seven_day', percentUsed: 92 }], cost: { usd: 4.21 } }

// One helper a tier, to see every costume side by side
const tiers = [
  ['Fable', 'claude-fable-5', 'high', 'general-purpose'],
  ['Opus at xhigh', 'claude-opus-5-5', 'xhigh', 'general-purpose'],
  ['Opus at high', 'claude-opus-5-5', 'high', 'Plan'],
  ['Opus at medium', 'claude-opus-5-5', 'medium', 'general-purpose'],
  ['Opus at low', 'claude-opus-5-5', 'low', 'general-purpose'],
  ['Sonnet', 'claude-sonnet-5', 'medium', 'general-purpose'],
  ['Haiku', 'claude-haiku-4-5', '', 'claude'],
  ['Explore on any model', 'claude-haiku-4-5', 'low', 'Explore'],
  ['A model the desk does not know', 'some-other-model', '', 'reviewer'],
].map(([description, model, effort, type], i) =>
  helper({ id: 't' + i, type, description, model, effort, startedAt: at - (60 + i * 37) * 1e3, contextTokens: 30000 + i * 9000, tokens: 90000 + i * 20000, costUsd: 0.1 + i * 0.07, requests: 3 + i, ...(i % 3 === 2 ? {} : { stepTotal: 6, stepDone: (i * 2) % 6, stepNote: 'step in hand' }) }),
)

// The project comes from the mod's own reader, fed a file of the real shape
const yaml = `milestones:
  - id: M1
    title: Knowledge + verification foundation
    slices:
      - id: 1a
        title: Workspace, CLI, doctor and CI
        status: done
        slices:
${[1, 2, 3, 4, 5].map((n) => `          - id: 1a.${n}\n            title: Tooling slice ${n}\n            status: done`).join('\n')}
      - id: 1b
        title: Knowledge layers 1–2
        slices:
${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `          - id: 1b.${n}\n            title: Knowledge slice ${n}\n            status: done`).join('\n')}
      - id: 1c
        title: MCP server, decisions and human docs
        slices:
${[1, 2, 3, 4, 5].map((n) => `          - id: 1c.${n}\n            title: Server slice ${n}\n            status: done`).join('\n')}
      - id: 1d
        title: Verification
        slices:
          - id: 1d.1
            title: Verify core and the first checks
            status: done
          - id: 1d.2
            title: "Verify: the remaining checks"
            summary: The analyzer, format, test and dependency checks behind appstein verify, each with a mapped problem and a fix hint.
            status: next
          - id: 1d.3
            title: Package checks with a very long title that has to be clipped to the width of the panel
            status: planned
          - id: 1d.4
            title: Suppression report
            status: planned
      - id: 1e
        title: First with/without trial
        status: planned
  - id: M2
    title: Design system and screens
    slices:
      - id: 2a
        title: Tokens and themes
        status: planned
      - id: 2b
        title: Screen recipes
        status: planned
  - id: M3
    title: Release and store readiness
    slices:
      - id: 3a
        title: Signing and build numbers
        status: planned
`
const project = desk.summarise(desk.parseProgress(yaml))
project.tickets = [
  { number: '01', title: 'Problem mapping for analyzer output', status: 'resolved' },
  { number: '02', title: 'paths.exist check', status: 'claimed' },
  { number: '03', title: 'Suppression counts in the report', status: 'open' },
]

// A turn's files: two writes of one file merged, a new file, a helper's write, and reads
const before = ['import "dart:io";', '', 'class Verify {', '  final String root;', '  Verify(this.root);', '', '  Future<int> run() async {', '    final checks = <Check>[];', '    return checks.length;', '  }', '}'].join('\n')
const after = before.replace('    final checks = <Check>[];', '    final checks = <Check>[PathsExist(root), AnalyzerClean(root)];\n    for (final check in checks) {\n      await check.run();\n    }')
const longNew = Array.from({ length: 30 }, (_, i) => (i === 0 ? '# Notes for slice 1d.2' : i === 1 ? '' : '- finding ' + i + ' about the verify checks, written out at some length so the line is long')).join('\n')
const root = 'C:/work/appstein/'
const turnNow = {
  edits: [
    { file: root + 'packages/appstein/lib/src/verify/verify_core.dart', who: 'Clawd', at: at - 95e3, ...desk.lineDiff(before, after) },
    { file: root + 'packages/appstein/lib/src/verify/verify_core.dart', who: 'Clawd', at: at - 40e3, ...desk.lineDiff('class Verify {\n  final String root;', 'class Verify {\n  /// The project the checks run on.\n  final String root;') },
    { file: root + 'docs/project/slices/1d.2/notes.md', who: 'Port the ticket reader to the new slice folders', at: at - 20e3, ...desk.lineDiff('', longNew) },
  ],
  reads: [
    { file: root + 'packages/appstein/lib/src/verify/problem.dart', at: at - 130e3, who: '' },
    { file: root + 'packages/appstein/lib/src/verify/verify_core.dart', at: at - 120e3, who: '' },
    { file: root + 'docs/project/progress.yaml', at: at - 12e3, who: '' },
    { file: root + 'AGENTS.md', at: at - 300e3, who: '' },
  ],
}
// Fifteen files: every third one written, two of them with a diff too long for its window
const fifteen = {
  edits: Array.from({ length: 5 }, (_, i) => ({ file: root + 'lib/src/checks/check_' + i * 3 + '.dart', who: i % 2 ? 'Check the Windows path cases' : 'Clawd', at: at - i * 27e3, ...(i === 1 || i === 2 ? desk.lineDiff('', longNew) : desk.lineDiff(before, after)) })),
  reads: Array.from({ length: 15 }, (_, i) => ({ file: root + 'lib/src/checks/check_' + i + '.dart', at: at - i * 9e3 - 1e3, who: '' })),
}
const checkKey = (n) => 'file:' + (root + 'lib/src/checks/check_' + n + '.dart').toLowerCase()
// Two helpers at work, one with steps and one that reported none
const working = [
  helper({ id: 'w1', type: 'general-purpose', description: 'Fix the seven things in the desk', model: 'claude-opus-5-5', effort: 'high', startedAt: at - 412e3, contextTokens: 96000, tokens: 380000, costUsd: 0.92, requests: 14, stepTotal: 8, stepDone: 5, stepNote: 'drawing the previews' }),
  helper({ id: 'w2', type: 'Explore', description: 'Read the hold path for the lost clicks', model: 'claude-haiku-4-5', effort: 'low', startedAt: at - 95e3, contextTokens: 22000, tokens: 61000, costUsd: 0.04, requests: 4 }),
]

const hold = (command, tool, who, damage) => ({ id: 'h' + command.length, tool, who, command, risk: desk.riskOf(tool, command), damage, decision: null })
const holds = [
  hold('git branch -D old-work spike/try-2', 'Bash', 'Clawd', 'deletes 1 branch (spike/try-2), merged or not · no such branch: old-work'),
  hold('git reset --hard origin/main', 'PowerShell', 'Find every caller of mapProblem', null),
]
const todos = [
  { title: 'Read the spec', status: 'completed', doing: 'Reading the spec' },
  { title: 'Write the failing test', status: 'completed', doing: '' },
  { title: 'Make it pass', status: 'in_progress', doing: 'Making the paths.exist check pass on Windows' },
  { title: 'Docs and notes', status: 'pending', doing: '' },
]

// A helper the desk never saw start gets a row from its first event
desk.set({ mood: 'working', note: '', team: [], usage, project: null, todos: [], openRow: '' })
const resumed = desk.teamWith('resumed-1', at - 30e3, 'claude-opus-5-5')
if (resumed.length !== 1 || resumed[0].description !== 'Helper' || resumed[0].status !== 'running') throw new Error('teamWith did not make a row')
if (desk.teamWith('', at, '').length !== 0) throw new Error('teamWith made a row for the main loop')

const base = { mood: 'working', note: 'running a command', team, usage, project, todos: [], openRow: '', branch: 'slice-1d2' }
const states = [
  { ...base, name: 'Held command, plan, a helper panel open on 30 actions', holds, todos, turnNow, openRow: 'r1', bubble: 'The paths.exist check passes on Linux now. Running the Windows cases next, then the docs for the two new checks and the guide pages.' },
  { ...base, name: 'The same panel, moved down a page; a finished helper with no steps', team: team.slice(1), openRow: 'r1', scrolls: { 'detail:r1': 20 }, project: { ...project, tickets: [] }, bubble: 'reading a file' },
  { ...base, name: 'Every costume, one row a tier', team: tiers, project: null, todos, bubble: 'briefing a helper' },
  { ...base, name: 'Fifteen files, in the middle, a long diff open in its middle: every arrow live', team: [], turnNow: fifteen, scrolls: { files: 4, ['diff:' + checkKey(6)]: 9 }, openRow: checkKey(6), mood: 'done', note: 'waiting for you', branch: 'feature/a-very-long-branch-name-that-must-be-cut-somewhere' },
  { ...base, name: 'The same list at its start, the diff at its start: both up arrows spent', team: [], project: null, turnNow: fifteen, scrolls: {}, openRow: checkKey(3), mood: 'done', note: 'waiting for you' },
  { ...base, name: 'The list at its end, a short diff open: the down arrow spent', team: [], project: null, turnNow: fifteen, scrolls: { files: 9 }, openRow: checkKey(12), mood: 'done', note: 'waiting for you' },
  { ...base, name: 'Two helpers at work; under the desk, the band above the prompt: waiting, ready but blocked, ready, idle, asking', team: working, project: null, todos, mood: 'done', note: 'waiting for you', bubble: 'State saved. Ready to compact.', bands: [['waiting', 2], ['ready', 2], ['ready', 0], ['idle', 0], ['asking', 0]] },
  { ...base, name: 'Project panel open, files of the last turn', team: team.slice(3), openRow: 'project', bubble: 'reading a file', todos, turnBefore: turnNow, usage: { ...usage, startedAt: at - 11520e3 } },
  { name: 'Nothing yet: no project, no team, plan done', mood: 'idle', note: 'ready', team: [], usage: null, project: null, todos: todos.map((t) => ({ ...t, status: 'completed' })), openRow: '', branch: 'main' },
]

const W = Number(process.argv[3] ?? 400)
// The app's row, which was measured as 18 to 20 px: the mod counts on 19
const ROW = Number(process.argv[4] ?? desk.ROW_PX)
const suffix = ROW === desk.ROW_PX ? '' : '-r' + ROW
// A part of the sheet as the app lays it out: a drawing as an image; over
// it, each group of buttons a box placed by its cells
const draw = (part, scheme) => {
  if ('row' in part || 'column' in part || 'press' in part) throw new Error('a part that is no drawing')
  if (part.source.length > 131072) throw new Error('an Svg is over 131072 characters')
  // The app draws each as an image: so does the preview, which also fixes the scheme
  const src = part.source.replace('(prefers-color-scheme: dark)', scheme === 'dark' ? '(min-width: 0px)' : '(max-width: 0px)')
  const picture = `<img width="${part.width}" height="${part.height}" alt="" src="data:image/svg+xml;base64,${Buffer.from(src).toString('base64')}">`
  if (!part.over?.length) return picture
  const over = part.over.map((o) => {
    for (const cells of [o.right, o.top ?? o.bottom]) if (!Number.isInteger(cells)) throw new Error('an offset that is no integer: ' + JSON.stringify(o))
    const edge = o.bottom !== undefined ? `bottom:${o.bottom * ROW}px` : `top:${o.top * ROW}px`
    return `<div class="ov" style="right:${o.right * desk.COL_PX - desk.EDGE_PX}px;${edge};min-height:${ROW}px;line-height:${ROW}px">${o.buttons.map((b) => `<span class="nb ${b.look}">${b.label}</span>`).join('')}</div>`
  })
  return `<div class="pic" style="width:${part.width}px;height:${part.height}px">${picture}${over.join('')}</div>`
}
// The band above the prompt as the app draws it: its words, then its buttons
// (the first a filled pill unless plain), then a quiet note
const bandRow = ([state, helpers]) => {
  const band = desk.bandOf(state, desk.blockerOf(false, false, helpers), '', '168k')
  const buttons = band.buttons.map((b) => `<span class="nb ${b.isPlain ? 'quiet' : 'main'}">${b.label}</span>`).join('')
  return `<div class="band"><span class="${band.color}">${band.text}</span>${buttons}</div>`
}
const column = (state, scheme) => {
  desk.set(state)
  // Drawn twice, five seconds apart: the first drawing of a bar grows from
  // nothing, and a still picture is to show it where it ends
  desk.barsDrawn.clear()
  desk.deskSheet(W, at - 5000)
  const parts = desk.deskSheet(W, at).map((part) => draw(part, scheme))
  return `<section class="${scheme}"><h2>${state.name}</h2>${parts.join('\n')}${(state.bands ?? []).map(bandRow).join('')}</section>`
}

const page = (body) => `<!doctype html><meta charset="utf-8"><title>crab-desk preview</title>
<style>body{margin:0;display:flex;flex-wrap:wrap;align-items:flex-start;gap:0;font:12px -apple-system,'Segoe UI',sans-serif;background:#555}
section{width:${W}px;padding:16px;display:flex;flex-direction:column;align-items:flex-start;min-height:100vh}
.dark{background:#1f1e1d;color:#a8a8a4}.light{background:#fff;color:#6b6b68}
h2{font-size:11px;font-weight:400;margin:0 0 12px;opacity:.7}img{display:block}
.pic{position:relative}.ov{position:absolute;display:flex;flex-direction:row;align-items:center;column-gap:16px;white-space:nowrap}
.nb{font:14px/1 'Segoe UI',-apple-system,sans-serif;line-height:inherit}
.dark .nb{color:#ececec}.light .nb{color:#1f1f1f}.dark .nb.quiet{color:#a8a8a4}.light .nb.quiet{color:#6b6b68}
.nb.quiet,.nb.chip{background:#8a8a8a40;height:22px;line-height:22px;padding:0 8px;margin-right:-8px}
.nb.main{margin-right:-12px;line-height:19px;padding:4px 12px;border-radius:8px;font-weight:500}.dark .nb.main{background:#fff;color:#1f1e1d}.light .nb.main{background:#1f1e1d;color:#fff}
.band{display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px;margin-top:14px;padding:8px 0;font-size:13px;border-top:1px solid #8884;width:100%}
.band .yellow{color:#c99a1e}.band .green{color:#3B9C5F}.band .nb{line-height:19px}</style>
${body}`
if (!suffix) writeFileSync(join(here, W === 400 ? 'preview.html' : `preview-${W}.html`), page(['dark', 'light'].map((scheme) => states.map((s) => column(s, scheme)).join('\n')).join('\n')))
for (const scheme of ['dark', 'light']) {
  for (let k = 0; k * 2 < states.length; k++) writeFileSync(join(here, `view-${scheme}-${k}${suffix}.html`), page(states.slice(k * 2, k * 2 + 2).map((s) => column(s, scheme)).join('\n')))
}
console.log('view-<scheme>-<n>' + suffix + '.html written, width ' + W + ', row ' + ROW)

// bars.html: the bars in motion, each picture an image as the app draws it.
// A row that changes value is a run of pictures drawn three seconds apart on
// the mod's clock, shown three seconds apart here: each grows from the value
// of the one before, and the sweep goes on across the change.
if (!suffix && W === 400) {
  const uri = (part, scheme) => 'data:image/svg+xml;base64,' + Buffer.from(part.source.replace('(prefers-color-scheme: dark)', scheme === 'dark' ? '(min-width: 0px)' : '(max-width: 0px)')).toString('base64')
  const rowOf = (a, t) => desk.cardParts(W, [desk.agentBlock(a, t)])[0]
  const settled = (a) => {
    rowOf(a, at - 5000)
    return [rowOf(a, at)]
  }
  desk.set({ ...base, team: [], project: null, openRow: '' })
  desk.barsDrawn.clear()
  const stepper = helper({ id: 'b4', type: 'general-purpose', description: 'A value that changes every 3 s', model: 'claude-sonnet-5', effort: 'medium', startedAt: at - 60e3, contextTokens: 52000, tokens: 140000, costUsd: 0.21, requests: 6, stepTotal: 6 })
  const rows = [
    ['Running, 5 of 8 steps: dots twinkle in five groups, a wave of brighter dots crosses the fill every 2.4 s', settled(working[0])],
    ['Running, no steps reported: the wave crosses the sparse track', settled(working[1])],
    ['Done: the same dots, still', settled(team[0])],
    ['Failed at 5 of 8: red, still', settled(team[2])],
    ['A value change: 0 to 6 of 6, one step every 3 s, then done; the fill grows in 600 ms', [0, 1, 2, 3, 4, 5, 6, 6].map((done, k) => rowOf({ ...stepper, stepDone: done, stepNote: 'step ' + done, ...(k === 7 ? { status: 'done', endedAt: at + 21e3 } : {}) }, at + k * 3000))],
    // Each of the three below is drawn once before its first picture, so that one shows its value whole
    ["Clawd's plan while he works: 1 to 4 of 4, one every 3 s", [1, 1, 2, 3, 4].map((done, k) => {
      desk.set({ ...base, team: [], project: null, openRow: '', todos: todos.map((t, i) => ({ ...t, status: i < done ? 'completed' : i === done ? 'in_progress' : 'pending' })) })
      return desk.cardParts(W, [desk.headBlock("Clawd's plan", done + ' of 4'), desk.planBlock({ done, total: 4, now: done < 4 ? todos[done].title : 'Plan done' }, at + k * 3000)])[0]
    }).slice(1)],
    ['The usage bars: still; each grows when its value changes (every 3 s here)', [[168000, 37, 92], [168000, 37, 92], [412000, 41, 92], [633000, 58, 93], [905000, 86, 97]].map(([tokens, five, seven], k) => {
      desk.set({ ...base, team: [], project: null, openRow: '', usage: { ...usage, context: { tokens, window: 1000000 }, rateLimits: [{ kind: 'five_hour', percentUsed: five }, { kind: 'seven_day', percentUsed: seven }] } })
      return desk.cardParts(W, [desk.headBlock('Usage'), desk.usageBlock(W, at + k * 3000)])[0]
    }).slice(1)],
    ['The project bar: 14 to 20 of 22 slices, one every 3 s; still, it grows', [14, 14, 15, 16, 18, 20].map((done, k) => {
      desk.set({ ...base, team: [], project: { ...project, done, total: 22, tickets: [] }, openRow: '' })
      return desk.cardParts(W, [desk.headBlock('Project'), desk.projectBlock(W, [], at + k * 3000)])[0]
    }).slice(1)],
  ]
  const side = (scheme) =>
    `<section class="${scheme}">${rows.map(([name, frames], r) => `<h2>${name}</h2><img id="${scheme}${r}" width="${frames[0].width}" height="${frames[0].height}" alt="" src="${uri(frames[0], scheme)}">`).join('\n')}</section>`
  const frames = JSON.stringify(Object.fromEntries(['dark', 'light'].flatMap((scheme) => rows.map(([, list], r) => [scheme + r, list.map((part) => uri(part, scheme))]))))
  writeFileSync(
    join(here, 'bars.html'),
    `<!doctype html><meta charset="utf-8"><title>crab-desk bars</title>
<style>body{margin:0;display:flex;flex-wrap:wrap;align-items:flex-start;font:12px -apple-system,'Segoe UI',sans-serif;background:#555}
section{width:${W}px;padding:16px;min-height:100vh}.dark{background:#1f1e1d;color:#a8a8a4}.light{background:#fff;color:#6b6b68}
h2{font-size:11px;font-weight:400;margin:18px 0 4px;opacity:.8}img{display:block}</style>
${side('dark')}${side('light')}
<script>
const frames = ${frames}
let k = 0
setInterval(() => {
  k++
  for (const [id, list] of Object.entries(frames)) if (list.length > 1) document.getElementById(id).src = list[k % list.length]
}, 3000)
</script>`,
  )
  console.log('bars.html written')
}
