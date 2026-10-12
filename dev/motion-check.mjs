// Checks that the bars really move in a browser: writes motion-check.html,
// which holds two helper rows as inline SVG (the same markup the app draws
// as an image), and after 700 ms writes into its <pre> whether motion is
// allowed there and where each animated piece then is.
// Run: node motion-check.mjs, then
// chrome --headless=new --virtual-time-budget=3000 --dump-dom file:///.../motion-check.html
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(here, '..', 'hooks', 'register.js'), 'utf8')
const desk = new Function(source.slice(0, source.indexOf('// --- The hooks')) + '\nreturn { cardParts, agentBlock, barsDrawn }')()
const at = 1_800_000_000_000
const helper = (over) => ({ type: 'general-purpose', model: 'claude-opus-5-5', effort: 'high', contextTokens: 1, tokens: 1, costUsd: 0, requests: 1, stepTotal: 0, stepDone: 0, stepNote: '', actions: [], outcome: '', status: 'running', startedAt: at - 60e3, ...over })
const row = (a, t) => desk.cardParts(400, [desk.agentBlock(a, t)])[0].source
// A row whose value just changed from 2 of 8 to 5 of 8, and one with no steps
row(helper({ id: 'steps', description: 'steps', stepTotal: 8, stepDone: 2 }), at - 5000)
const grown = row(helper({ id: 'steps', description: 'steps', stepTotal: 8, stepDone: 5 }), at + 100)
const blind = row(helper({ id: 'nosteps', description: 'no steps' }), at + 100)
writeFileSync(
  join(here, 'motion-check.html'),
  `<!doctype html><meta charset="utf-8"><body>${grown}${blind}<pre id="out"></pre><script>
setTimeout(() => {
  const at = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).transform + ' / ' + getComputedStyle(el).animationName : 'missing' }
  const dim = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).opacity + ' / ' + getComputedStyle(el).animationName + ' / ' + getComputedStyle(el).animationDelay : 'missing' }
  document.getElementById('out').textContent = JSON.stringify({
    motionAllowed: matchMedia('(prefers-reduced-motion: no-preference)').matches,
    fillWindowWhileGrowing: at('.g-helper-steps'), capWhileGrowing: at('.e-helper-steps'), waveOnFill: at('.s-helper-steps'), waveOnTrack: at('.s-helper-nosteps'),
    twinkles: [0, 1, 2, 3, 4].map((i) => dim('.w' + i)),
  }, null, 1)
}, 300)
</script>`,
)
console.log('motion-check.html written')
