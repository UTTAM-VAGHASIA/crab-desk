// Checks the desk's two pure pieces, riskOf and lineDiff, cut out of
// register.js between their marks. Run: node pure.test.mjs [path to register.js]
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const modFile = process.argv[2] ?? join(here, '..', 'hooks', 'register.js')
const source = readFileSync(modFile, 'utf8')
const cut = (name) => {
  const from = source.indexOf('// >>> ' + name)
  const to = source.indexOf('// <<< ' + name)
  if (from < 0 || to < 0) throw new Error('marks not found for ' + name)
  return source.slice(from, to)
}
const { riskOf, lineDiff } = new Function(cut('lineDiff') + '\n' + cut('riskOf') + '\nreturn { riskOf, lineDiff }')()

let passed = 0
let failed = 0
const check = (name, isRight, got) => {
  if (isRight) passed++
  else {
    failed++
    console.log('FAIL ' + name + '\n     got ' + JSON.stringify(got))
  }
}
// A command that must be held: its kind, and its targets and folder when given
const risky = (tool, command, kind, targets, dir) => {
  const got = riskOf(tool, command)
  const isRight = got !== null && got.kind === kind && (targets === undefined || JSON.stringify(got.targets) === JSON.stringify(targets)) && (dir === undefined || got.dir === dir)
  check(tool + ' risky: ' + command, isRight, got)
}
const safe = (tool, command) => {
  const got = riskOf(tool, command)
  check(tool + ' safe: ' + command, got === null, got)
}

// --- Bash: rm
risky('Bash', 'rm -rf build', 'delete', ['build'])
risky('Bash', 'rm -fr build dist', 'delete', ['build', 'dist'])
risky('Bash', 'rm -r build', 'delete', ['build'])
risky('Bash', 'rm -f a.txt', 'delete', ['a.txt'])
risky('Bash', 'rm build -Rf', 'delete', ['build'])
risky('Bash', 'rm --recursive --force build', 'delete', ['build'])
risky('Bash', 'rm -rf "My Folder/build output"', 'delete', ['My Folder/build output'])
risky('Bash', "rm -rf 'C:/Users/uttam/My Docs/x'", 'delete', ['C:/Users/uttam/My Docs/x'])
risky('Bash', 'rm -rf -- -odd-name', 'delete', ['-odd-name'])
risky('Bash', 'sudo rm -rf /var/tmp/x', 'delete', ['/var/tmp/x'])
risky('Bash', '\\rm -rf x', 'delete', ['x'])
risky('Bash', '/bin/rm -rf x', 'delete', ['x'])
risky('Bash', 'FOO=1 rm -rf x', 'delete', ['x'])
safe('Bash', 'rm a.txt')
safe('Bash', 'rm -i a.txt')
safe('Bash', 'rm -v a.txt b.txt')
safe('Bash', 'rmdir empty')
safe('Bash', 'ls -rf')
safe('Bash', 'grep -rf patterns.txt src')

// --- Bash: chains, cd, subshells, quoting
risky('Bash', 'cd build && rm -rf *', 'delete', ['*'], 'build')
risky('Bash', 'cd a && cd b && rm -rf out', 'delete', ['out'], 'a/b')
risky('Bash', 'npm run clean; rm -rf node_modules', 'delete', ['node_modules'])
risky('Bash', 'ls | xargs rm -rf', 'delete')
risky('Bash', 'true || rm -rf x', 'delete', ['x'])
risky('Bash', '(cd sub && rm -rf out)', 'delete', ['out'], 'sub')
risky('Bash', 'echo start\nrm -rf x\necho end', 'delete', ['x'])
risky('Bash', 'echo $(rm -rf x)', 'delete', ['x'])
risky('Bash', 'echo "$(rm -rf x)"', 'delete', ['x'])
risky('Bash', 'bash -c "rm -rf x"', 'delete', ['x'])
risky('Bash', 'bash -lc "cd y && git reset --hard"', 'git-reset', undefined, 'y')
risky('Bash', "find . -name '*.log' -exec rm -f {} +", 'delete')
risky('Bash', 'find build -type f -delete', 'delete', ['build'])
risky('Bash', 'cmd /c "rmdir /s /q build"', 'delete', ['build'])
risky('Bash', 'powershell -Command "Remove-Item -Recurse -Force build"', 'delete', ['build'])
risky('Bash', 'echo done 2>&1 && rm -rf x', 'delete', ['x'])
safe('Bash', 'git commit -m "rm -rf x"')
safe('Bash', 'echo "git reset --hard"')
safe('Bash', "echo 'rm -rf /'")
safe('Bash', 'echo hi # rm -rf x')
safe('Bash', 'grep -n "rm -rf" notes.md | head -5')
safe('Bash', "git commit -m \"$(cat <<'EOF'\nfix: the hold\n\nrm -rf build is now held\ngit reset --hard too\nEOF\n)\"")
safe('Bash', 'cat <<EOF > notes.txt\ngit clean -fd\nEOF')
safe('Bash', 'fvm dart test && fvm dart analyze')

// --- git, in both shells
risky('Bash', 'git reset --hard', 'git-reset')
risky('Bash', 'git reset --hard HEAD~2', 'git-reset', ['HEAD~2'])
risky('Bash', 'git -C sub reset --hard', 'git-reset', [], 'sub')
risky('Bash', 'cd repo && git -C sub reset --hard', 'git-reset', [], 'repo/sub')
risky('Bash', 'git clean -fd', 'git-clean')
risky('Bash', 'git clean -xdf', 'git-clean')
risky('Bash', 'git clean --force', 'git-clean')
risky('Bash', 'git push --force', 'git-push')
risky('Bash', 'git push -f origin main', 'git-push', ['origin', 'main'])
risky('Bash', 'git push --force-with-lease origin feature', 'git-push', ['origin', 'feature'])
risky('Bash', 'git push origin +main', 'git-push')
risky('Bash', 'git checkout -- .', 'git-checkout')
risky('Bash', 'git checkout .', 'git-checkout')
risky('Bash', 'git restore .', 'git-checkout')
risky('Bash', 'git branch -D old-work', 'git-branch', ['old-work'])
risky('Bash', 'git stash drop', 'git-stash')
risky('Bash', 'git stash clear', 'git-stash')
risky('Bash', 'git add . && git stash drop stash@{1}', 'git-stash')
risky('PowerShell', 'git reset --hard origin/main', 'git-reset', ['origin/main'])
risky('PowerShell', 'git push --force; git status', 'git-push')
safe('Bash', 'git push')
safe('Bash', 'git push origin main')
safe('Bash', 'git push -u origin feature')
safe('Bash', 'git reset --soft HEAD~1')
safe('Bash', 'git reset HEAD file.txt')
safe('Bash', 'git clean -n')
safe('Bash', 'git clean -nfd')
safe('Bash', 'git checkout main')
safe('Bash', 'git checkout -b feature')
safe('Bash', 'git restore --staged .')
safe('Bash', 'git branch -d merged')
safe('Bash', 'git stash')
safe('Bash', 'git stash pop')
safe('Bash', 'git status --porcelain')
safe('Bash', 'git log --oneline -5')
safe('PowerShell', 'git commit -m "git push --force is held"')

// --- PowerShell: Remove-Item and its aliases
risky('PowerShell', 'Remove-Item -Recurse -Force .\\build', 'delete', ['.\\build'])
risky('PowerShell', 'Remove-Item .\\build -Recurse', 'delete', ['.\\build'])
risky('PowerShell', 'Remove-Item -Force a.txt', 'delete', ['a.txt'])
risky('PowerShell', 'remove-item -recurse build', 'delete', ['build'])
risky('PowerShell', "Remove-Item 'C:\\My Folder\\out' -Recurse -Force", 'delete', ['C:\\My Folder\\out'])
risky('PowerShell', 'Remove-Item -Path "C:\\Users\\uttam\\My Docs\\x" -Recurse', 'delete', ['C:\\Users\\uttam\\My Docs\\x'])
risky('PowerShell', 'Remove-Item a,b -Recurse -ErrorAction SilentlyContinue', 'delete', ['a', 'b'])
risky('PowerShell', 'rm -r build', 'delete', ['build'])
risky('PowerShell', 'rm -rf build', 'delete', ['build'])
risky('PowerShell', 'ri build -fo', 'delete', ['build'])
risky('PowerShell', 'del build -Recurse', 'delete', ['build'])
risky('PowerShell', 'rd build -Recurse -Force', 'delete', ['build'])
risky('PowerShell', 'rmdir /s /q build', 'delete', ['build'])
risky('PowerShell', 'del /s *.tmp', 'delete', ['*.tmp'])
risky('PowerShell', 'cmd /c "rd /s /q C:\\temp\\x"', 'delete', ['C:\\temp\\x'])
risky('PowerShell', 'Get-ChildItem build | Remove-Item -Recurse -Force', 'delete', [])
risky('PowerShell', 'Set-Location build; Remove-Item * -Recurse', 'delete', ['*'], 'build')
risky('PowerShell', 'cd build; if ($?) { Remove-Item out -Recurse }', 'delete', ['out'], 'build')
risky('PowerShell', 'Get-ChildItem | ForEach-Object { Remove-Item $_ -Force }', 'delete')
safe('PowerShell', 'Remove-Item a.txt')
safe('PowerShell', 'rm a.txt')
safe('PowerShell', 'del a.txt')
safe('PowerShell', 'Write-Output "Remove-Item -Recurse -Force build"')
safe('PowerShell', "Write-Host 'git reset --hard'")
safe('PowerShell', 'Get-ChildItem -Recurse -Force')
safe('PowerShell', "$msg = @'\nRemove-Item -Recurse x\n'@\nWrite-Output $msg")
safe('PowerShell', 'fvm dart run tool/gen_docs.dart; if ($?) { fvm dart test }')

// A classifier never throws on odd input
for (const odd of ['', '   ', '"', "'", '$(', '`', '&&', '| |', 'rm', 'git', '\\', 'a\n\n;;b', null, undefined, 42]) {
  let threw = false
  try {
    riskOf('Bash', odd)
    riskOf('PowerShell', odd)
  } catch {
    threw = true
  }
  check('no throw on ' + JSON.stringify(odd), !threw, 'threw')
}

// --- lineDiff
const same = (name, got, want) => check('lineDiff ' + name, JSON.stringify(got) === JSON.stringify(want), got)
const text = (lines) => lines.map((l) => l.op + l.t).join('|')
{
  const d = lineDiff('a\nb\nc\n', 'a\nB\nc\n')
  same('one line changed: counts', [d.add, d.del], [1, 1])
  same('one line changed: lines', text(d.lines), ' a|-b|+B| c')
}
{
  const d = lineDiff('', 'x\ny\n')
  same('new file is all additions', [d.add, d.del, text(d.lines)], [2, 0, '+x|+y'])
}
{
  const d = lineDiff('x\ny', '')
  same('emptied file is all removals', [d.add, d.del, text(d.lines)], [0, 2, '-x|-y'])
}
{
  const d = lineDiff('same\ntext\n', 'same\ntext\n')
  same('no change', [d.add, d.del, d.lines.length], [0, 0, 0])
}
{
  const d = lineDiff('a\r\nb\r\n', 'a\nb\nc\n')
  same('line endings do not count', [d.add, d.del], [1, 0])
}
{
  const before = Array.from({ length: 3000 }, (_, i) => 'line ' + i)
  const after = [...before]
  after[10] = 'changed early'
  after[2990] = 'changed late'
  const d = lineDiff(before.join('\n'), after.join('\n'))
  // Too far apart to compare line by line: the middle goes as removed, then added
  same('long file, two far changes: bounded', [d.lines.length <= 200, d.add === d.del, d.add > 2], [true, true, true])
}
{
  const before = Array.from({ length: 3000 }, (_, i) => 'line ' + i)
  const after = [...before]
  after.splice(1500, 1, 'new a', 'new b')
  const d = lineDiff(before.join('\n'), after.join('\n'))
  same('long file, one change: exact', [d.add, d.del, text(d.lines)], [2, 1, ' line 1499|-line 1500|+new a|+new b| line 1501'])
}
{
  const d = lineDiff('1\n2\n3\n4\n5\n6\n7\n8\n9', '1\nX\n3\n4\n5\n6\n7\nY\n9')
  same('two runs get a gap mark', text(d.lines), ' 1|-2|+X| 3|~⋯| 7|-8|+Y| 9')
}
{
  const d = lineDiff('', Array.from({ length: 500 }, (_, i) => 'n' + i).join('\n'))
  same('a long new file is cut to 200 lines, counted whole', [d.add, d.lines.length], [500, 200])
}

// --- clock, tierOf, branchDamage: each cut out between its own marks
const { clock, tierOf, KIND_COLOR, branchDamage } = new Function(cut('clock') + '\n' + cut('tierOf') + '\n' + cut('branchDamage') + '\nreturn { clock, tierOf, KIND_COLOR, branchDamage }')()
const is = (name, got, want) => check(name, got === want, got)
const H = 3600e3
is('clock: under a minute', clock(5e3), '0:05')
is('clock: minutes and seconds', clock(754e3), '12:34')
is('clock: just under an hour', clock(H - 1e3), '59:59')
is('clock: an hour', clock(H), '1h 0m')
is('clock: hours and minutes', clock(3 * H + 12 * 60e3 + 40e3), '3h 12m')
is('clock: just under a day', clock(24 * H - 60e3), '23h 59m')
is('clock: a day', clock(24 * H), '1d 0h')
is('clock: 110:23:49 is days and hours', clock(110 * H + 23 * 60e3 + 49e3), '4d 14h')
is('clock: never negative', clock(-5e3), '0:00')

is('tier: Fable is the astronaut', tierOf('general-purpose', 'claude-fable-5', 'high'), 'astronaut')
is('tier: Opus xhigh is the detective', tierOf('general-purpose', 'claude-opus-5-5', 'xhigh'), 'detective')
is('tier: Opus max is the detective', tierOf('Plan', 'claude-opus-5-5', 'max'), 'detective')
is('tier: Opus high is the engineer', tierOf('general-purpose', 'claude-opus-5-5', 'high'), 'engineer')
is('tier: Opus medium is the chef', tierOf('general-purpose', 'claude-opus-5-5', 'medium'), 'chef')
is('tier: Opus low is the racer', tierOf('general-purpose', 'claude-opus-5-5', 'low'), 'racer')
is('tier: Opus, effort unknown, is the engineer', tierOf('general-purpose', 'claude-opus-5-5', ''), 'engineer')
is('tier: Opus, effort a number, is the engineer', tierOf('general-purpose', 'claude-opus-5-5', 3), 'engineer')
is('tier: Sonnet is the scholar', tierOf('general-purpose', 'claude-sonnet-5', 'high'), 'scholar')
is('tier: Haiku is the cadet', tierOf('claude', 'claude-haiku-4-5', undefined), 'cadet')
is('tier: Explore is the pirate on Haiku', tierOf('Explore', 'claude-haiku-4-5', 'low'), 'pirate')
is('tier: Explore is the pirate on Fable', tierOf('Explore', 'claude-fable-5', 'max'), 'pirate')
is('tier: a plugin Explore is the pirate', tierOf('kit:explore', 'claude-opus-5-5', 'high'), 'pirate')
is('tier: a type alone does not dress it', tierOf('Plan', '', ''), 'plain')
is('tier: an unknown model is plain', tierOf('reviewer', 'some-other-model', 'high'), 'plain')
is('tier: nothing known is plain', tierOf(undefined, undefined, undefined), 'plain')
for (const tier of ['astronaut', 'detective', 'engineer', 'chef', 'racer', 'scholar', 'cadet', 'pirate', 'plain']) {
  check('tier: ' + tier + ' has a color of its own', /^#[0-9A-F]{6}$/i.test(KIND_COLOR[tier] ?? '') && Object.values(KIND_COLOR).filter((c) => c === KIND_COLOR[tier]).length === 1, KIND_COLOR[tier])
}

is('branch: none named', branchDamage([], []), 'deletes a branch, merged or not')
is('branch: one there', branchDamage(['old-work'], []), 'deletes 1 branch (old-work), merged or not')
is('branch: two there', branchDamage(['a', 'b'], []), 'deletes 2 branches (a, b), merged or not')
is('branch: the one named is not there', branchDamage(['old-work'], ['old-work']), 'no such branch: nothing to delete (old-work)')
is('branch: none of two is there', branchDamage(['a', 'b'], ['a', 'b']), 'no such branch: nothing to delete (a, b)')
is('branch: one of two is there', branchDamage(['a', 'b'], ['a']), 'deletes 1 branch (b), merged or not · no such branch: a')

// --- The grid a native button is placed on, and the arrows' moves
const { COL_PX, ROW_PX, EDGE_PX, colsFor, insetOf, rowsFor, midOf, stepOf, scrollTo, barSlices, thumbOf } = new Function(
  cut('grid') + '\nreturn { COL_PX, ROW_PX, EDGE_PX, colsFor, insetOf, rowsFor, midOf, stepOf, scrollTo, barSlices, thumbOf }',
)()
is('grid: a column is 8 px, a row 19', COL_PX + ' ' + ROW_PX, '8 19')
is('grid: a word 20 px inside the edge is 3 columns in', colsFor(20), 3)
is('grid: 3 columns in ends the word 20 px inside', insetOf(3), 20)
is('grid: a word 36 px inside the edge is 5 columns in', colsFor(36), 5)
is('grid: a word 48 px inside is 7 columns in, 52 px inside', colsFor(48) + ' ' + insetOf(colsFor(48)), '7 52')
is('grid: column 0 ends the word past the edge', insetOf(0), -EDGE_PX)
is('grid: nothing asked is still no negative column', colsFor(-40), 0)
for (const px of [0, 1, 7, 12, 20, 21, 33, 36, 100]) check('grid: a word asked ' + px + ' px inside never lands nearer the edge', insetOf(colsFor(px)) >= px && insetOf(colsFor(px)) < px + COL_PX, insetOf(colsFor(px)))
is('grid: a middle half a row down is row 0', rowsFor(9.5), 0)
is('grid: a middle a row and a half down is row 1', rowsFor(28.5), 1)
is('grid: a middle at 26 px is nearest row 1', rowsFor(26), 1)
is('grid: a middle at 18 px is nearest row 0', rowsFor(18), 0)
is('grid: above the edge is still row 0', rowsFor(-30), 0)
is('grid: row 1 has its middle at 28.5', midOf(1), 28.5)
for (const rows of [0, 1, 2, 5]) is('grid: row ' + rows + ' is the row of its own middle', rowsFor(midOf(rows)), rows)
for (const y of [0, 9, 19, 30, 47, 66]) check('grid: the row for ' + y + ' px has its middle within half a row', Math.abs(midOf(rowsFor(y)) - Math.max(y, ROW_PX / 2)) <= ROW_PX / 2, midOf(rowsFor(y)))
is('scroll: a window of 6 moves 2', stepOf(6), 2)
is('scroll: a window of 11 moves 4', stepOf(11), 4)
is('scroll: a window of 12 moves 4', stepOf(12), 4)
is('scroll: a small window still moves 2', stepOf(3), 2)
for (const size of [6, 8, 11, 12, 20]) check('scroll: a window of ' + size + ' moves less than a page', stepOf(size) < size - 1, stepOf(size))
is('scroll: down from the start', scrollTo(0, 4, 25), 4)
is('scroll: down stops at the end', scrollTo(23, 4, 25), 25)
is('scroll: down at the end stays', scrollTo(25, 4, 25), 25)
is('scroll: up stops at the start', scrollTo(2, -4, 25), 0)
is('scroll: up at the start stays', scrollTo(0, -4, 25), 0)
is('scroll: a list that fits never moves', scrollTo(0, 2, 0), 0)
is('scroll: a place past a list that shrank comes back in', scrollTo(30, -2, 10), 10)
is('scroll: a negative end is no end', scrollTo(3, 2, -1), 0)

// --- One scroll bar through several pictures: its slices join with no gap
{
  const heights = [57, 57, 215, 57, 57]
  const cap = 22
  const slices = barSlices(heights, cap)
  const total = heights.reduce((a, b) => a + b, 0)
  is('bar: it is as long as the pictures less a cap at each end', slices[0].whole, total - cap * 2)
  is('bar: the first slice starts under the up arrow', slices[0].y + ' ' + slices[0].offset, cap + ' 0')
  is('bar: the first slice runs to its picture\'s bottom edge', slices[0].y + slices[0].len, 57)
  is('bar: the last slice ends above the down arrow', slices[4].y + slices[4].len, 57 - cap)
  check('bar: every slice between the ends fills its picture, top to bottom', slices.slice(1, 4).every((s, i) => s.y === 0 && s.len === heights[i + 1]), slices)
  check('bar: each slice starts in the bar where the one before ended', slices.every((s, i) => i === 0 || s.offset === slices[i - 1].offset + slices[i - 1].len), slices)
  is('bar: the slices add up to the whole bar', slices.reduce((sum, s) => sum + s.len, 0), total - cap * 2)
  check('bar: every slice knows the same whole', slices.every((s) => s.whole === slices[0].whole), slices)
  const one = barSlices([100], cap)
  is('bar: a single picture holds the whole bar', one[0].y + ' ' + one[0].len + ' ' + one[0].whole, '22 56 56')
  const small = barSlices([10, 60, 10], cap)
  is('bar: a picture shorter than the cap has no slice', small[0].len + ' ' + small[2].len, '0 0')
  is('bar: the bar then starts inside the next picture', small[1].y + ' ' + small[1].len + ' ' + small[1].offset, '12 36 0')
  is('bar: pictures too short for two caps have no bar', barSlices([20, 20], cap).map((s) => s.len).join(' '), '0 0')
  is('bar: no pictures, no slices', barSlices([], cap).length, 0)
}
is('thumb: at the start it is at the top', thumbOf(200, 0, 6, 15, 9).from, 0)
is('thumb: its length is the part of the list that shows', thumbOf(200, 0, 6, 15, 9).len, 80)
is('thumb: at the end it reaches the bottom', thumbOf(200, 9, 6, 15, 9).from + thumbOf(200, 9, 6, 15, 9).len, 200)
is('thumb: in the middle it is in between', thumbOf(200, 4, 6, 15, 9).from, 53)
is('thumb: never shorter than 14 px', thumbOf(200, 0, 6, 600, 594).len, 14)
is('thumb: never longer than its bar', thumbOf(10, 0, 6, 7, 1).len, 10)
is('thumb: a place past the end is the end', thumbOf(200, 99, 6, 15, 9).from, 120)
is('thumb: a list that fits has it at the top', thumbOf(200, 0, 6, 4, 0).from, 0)

// --- A bar's fill from one drawing to the next, and its sweep's place
const { GROW_MS, SWEEP_MS, easeOut, barStep, sweepDelay } = new Function(cut('bars') + '\nreturn { GROW_MS, SWEEP_MS, easeOut, barStep, sweepDelay }')()
is('grow: a growth takes 600 ms and a sweep 2.4 s', GROW_MS + ' ' + SWEEP_MS, '600 2400')
is('grow: easing starts at 0 and ends at 1', easeOut(0) + ' ' + easeOut(1), '0 1')
check('grow: easing out is ahead of the clock', easeOut(0.5) > 0.5, easeOut(0.5))
is('grow: easing never leaves 0 to 1', easeOut(-3) + ' ' + easeOut(7), '0 1')
is('grow: a bar never drawn grows from nothing', JSON.stringify(barStep(undefined, 0.4, 1000)), '{"from":0,"to":0.4,"at":1000}')
{
  const first = barStep(undefined, 0.4, 1000)
  check('grow: the same value at a later drawing keeps its record', barStep(first, 0.4, 1300) === first, barStep(first, 0.4, 1300))
  const later = barStep(first, 0.8, 5000)
  is('grow: a new value starts from the one drawn before', JSON.stringify(later), '{"from":0.4,"to":0.8,"at":5000}')
  const midway = barStep(first, 0.8, 1300)
  check('grow: a new value in the middle of a growth starts from where the fill was', midway.from > 0.2 && midway.from < 0.4 && midway.to === 0.8 && midway.at === 1300, midway)
  is('grow: a value going down is recorded the same way', JSON.stringify(barStep(later, 0.2, 9000)), '{"from":0.8,"to":0.2,"at":9000}')
}
is('grow: a value is kept within 0 to 1', barStep(undefined, 1.7, 0).to + ' ' + barStep(undefined, -2, 0).to, '1 0')
is('grow: a value that is no number is nothing', barStep(undefined, undefined, 0).to, 0)
is('sweep: at a whole period it starts from its beginning', sweepDelay(2400 * 7), -0)
is('sweep: a second into its period it is a second in', sweepDelay(2400 * 7 + 1000), -1000)
is('sweep: two drawings 2 s apart differ by 2 s of it', sweepDelay(2400 * 9 + 2100) - sweepDelay(2400 * 9 + 100), -2000)
for (const now of [0, 1, 2399, 2400, 123456789]) check('sweep: the delay at ' + now + ' is within one period back', sweepDelay(now) <= 0 && sweepDelay(now) > -2400, sweepDelay(now))

// --- A bar's dots: the field of a fill, the wave of a running bar
{
  const { DOT_PITCH, TWINKLES, WAVE_COLS, dotRank, dotAt, dotField, waveDots, waveTravel } = new Function(cut('bars') + '\nreturn { DOT_PITCH, TWINKLES, WAVE_COLS, dotRank, dotAt, dotField, waveDots, waveTravel }')()
  const dots = (d) => [...d.matchAll(/M(-?\d+) (\d+)h(\d)v\d/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]), size: Number(m[3]) }))
  const inCols = (list, from, to) => list.filter((p) => p.x >= from * DOT_PITCH && p.x < to * DOT_PITCH)
  is('dots: every rank of the dither matrix is there once', [...new Set(Array.from({ length: 16 }, (_, i) => dotRank(i % 4, Math.floor(i / 4))))].sort((a, b) => a - b).join(' '), Array.from({ length: 16 }, (_, i) => i).join(' '))
  is('dots: the matrix repeats every four cells, either way from the start', dotRank(-3, 5) + ' ' + dotRank(9, -2), dotRank(1, 1) + ' ' + dotRank(1, 2))
  is('dots: a large dot fills its cell from the corner', dotAt(2, 1, 3), 'M8 4h3v3h-3z')
  is('dots: a dot of one pixel stands in the middle of its cell', dotAt(2, 1, 1), 'M9 5h1v1h-1z')
  is('dots: no column, no dot', dotField(0, 3).join('|'), '')
  const still = dotField(80, 3)
  is('dots: a still field is one path', still.length, 1)
  const all = dots(still[0])
  check('dots: every dot is on the grid, inside the field', all.every((p) => p.x % DOT_PITCH === 0 && p.y % DOT_PITCH === 0 && p.x < 80 * DOT_PITCH && p.y < 3 * DOT_PITCH && p.x + p.size <= 80 * DOT_PITCH - 1 && p.y + p.size <= 11), all.length)
  check('dots: the start is sparse', inCols(all, 0, 16).length < 16 * 3 * 0.45, inCols(all, 0, 16).length)
  is('dots: the leading edge has every dot', inCols(all, 76, 80).length, 12)
  check('dots: the field grows denser toward its leading edge', inCols(all, 0, 20).length < inCols(all, 30, 50).length && inCols(all, 30, 50).length < inCols(all, 60, 80).length, [inCols(all, 0, 20).length, inCols(all, 30, 50).length, inCols(all, 60, 80).length])
  check('dots: the start has small dots only, the leading edge large ones only', inCols(all, 0, 16).every((p) => p.size === 2) && inCols(all, 76, 80).every((p) => p.size === 3), 0)
  is('dots: a field is the same at every drawing', dotField(80, 3)[0], still[0])
  const live = dotField(80, 3, TWINKLES)
  is('dots: a running field has a still path and one for each twinkle', live.length, TWINKLES + 1)
  is('dots: twinkling moves no dot and loses none', dots(live.join('')).length + ' ' + [...new Set(live.join('').match(/M[^z]+z/g))].length, all.length + ' ' + all.length)
  check('dots: a good third stays still, and every group breathes', dots(live[0]).length > all.length / 4 && live.slice(1).every((d) => dots(d).length > 0), live.map((d) => dots(d).length))
  const short = dots(dotField(4, 3)[0])
  check('dots: a short fill is the dense end, not a small copy of the whole', short.length >= 9, short.length)
  const wave = dots(waveDots(3))
  check('dots: the wave waits out of sight, left of the bar', wave.length > 0 && wave.every((p) => p.x < 0 && p.x >= -WAVE_COLS * DOT_PITCH && p.x + p.size <= 0), wave)
  const mid = wave.filter((p) => p.x === -5 * DOT_PITCH).length
  check('dots: the wave is full in its middle and thinner at both ends', mid === 3 && wave.filter((p) => p.x === -WAVE_COLS * DOT_PITCH).length < 3 && wave.filter((p) => p.x === -DOT_PITCH).length < 3, wave.length)
  is('dots: a wave crosses in whole columns', JSON.stringify(waveTravel(340)), JSON.stringify({ far: (85 + WAVE_COLS) * DOT_PITCH, steps: 85 + WAVE_COLS }))
  check('dots: a wave ends out of sight whatever the width', [1, 24, 85, 339, 341].every((w) => waveTravel(w).far - WAVE_COLS * DOT_PITCH >= w && waveTravel(w).far % DOT_PITCH === 0), 0)
}

// --- What stands in a compaction's way, and what the band says of it
const { blockerOf, reasonOf, bandOf, compactStep } = new Function(cut('compact') + '\nreturn { blockerOf, reasonOf, bandOf, compactStep }')()
is('compact: nothing in the way', blockerOf(false, false, 0), null)
is('compact: a running turn', blockerOf(false, true, 0).text, "Clawd's turn is still running")
check('compact: a running turn ends by itself', blockerOf(false, true, 0).isPassing, blockerOf(false, true, 0))
is('compact: two helpers', blockerOf(false, false, 2).text, '2 helpers are still working')
is('compact: one helper', blockerOf(false, false, 1).text, '1 helper is still working')
is('compact: the helpers are waited for', blockerOf(false, false, 2).until, 'the 2 helpers finish')
is('compact: a held command', blockerOf(true, false, 0).text, 'a command is held for your answer')
check('compact: a held command does not end by itself', !blockerOf(true, true, 3).isPassing, blockerOf(true, true, 3))
is('compact: the turn comes before the helpers', blockerOf(false, true, 2).text, "Clawd's turn is still running")
is('compact: a refusal keeps its own words', reasonOf(new Error('cannot compact\n  while a turn is running')), 'cannot compact while a turn is running')
is('compact: a refusal that is a string', reasonOf('blocked by a PreCompact hook'), 'blocked by a PreCompact hook')
is('compact: a refusal that says nothing', reasonOf(new Error('')) + '|' + reasonOf(undefined), 'no reason was given|no reason was given')
check('compact: a long refusal is cut', reasonOf('x'.repeat(500)).length === 160, reasonOf('x'.repeat(500)).length)
{
  const helpers = blockerOf(false, false, 2)
  const safe = bandOf('ready', null, '', '412k')
  is('band: a safe point is green with nothing in the way', safe.color + ': ' + safe.text, 'green: Clawd is at a safe point to compact.')
  is('band: ready and clear, the button says Compact now', safe.buttons.map((b) => b.key + ':' + b.label).join(' '), 'desk-compact-now:Compact now desk-compact-later:Not now')
  const blocked = bandOf('ready', helpers, '', '412k')
  is('band: with helpers at work it names them, not the safe point', blocked.color + ': ' + blocked.text, 'yellow: Clawd is ready to compact, but 2 helpers are still working.')
  is('band: the button then says it will wait', blocked.buttons[0].label, 'Compact when clear')
  is('band: after a wait that ran out the button tries anyway', bandOf('ready', helpers, '', '412k', true).buttons[0].label, 'Try anyway')
  const waiting = bandOf('waiting', helpers, '', '412k')
  is('band: waiting says for what', waiting.text, 'Compacting when the 2 helpers finish.')
  is('band: waiting has a Cancel button only', waiting.buttons.map((b) => b.key + ':' + b.label).join(' '), 'desk-compact-cancel:Cancel')
  is('band: waiting for the turn', bandOf('waiting', blockerOf(false, true, 2), '', '').text, 'Compacting when this turn finishes.')
  is('band: waiting with nothing left in the way', bandOf('waiting', null, '', '').text, 'Compacting in a moment.')
  is('band: asking says so and can be cancelled', bandOf('asking', null, '', '').text + ' ' + bandOf('asking', null, '', '').buttons[0].label, 'Clawd is finding a safe place to stop, then compacts. Cancel')
  is('band: compacting has no button', bandOf('compacting', null, '', '').buttons.length, 0)
  const idle = bandOf('idle', null, '', '412k')
  is('band: idle with a large context says what a press does', idle.text + ' ' + idle.buttons[0].key + ':' + idle.buttons[0].label, 'Context is at 412k. desk-compact:Ask Clawd to get ready')
  check('band: Compact now is said in no state but ready with nothing in the way', ['idle', 'asking', 'waiting', 'compacting'].every((s) => bandOf(s, null, '', '').buttons.every((b) => b.label !== 'Compact now')) && blocked.buttons.every((b) => b.label !== 'Compact now'), '')
  is('band: a note is kept', bandOf('ready', null, 'Could not compact: busy', '').note, 'Could not compact: busy')
}

// --- The compaction's states: every state against every event
{
  const step = (state, event, isBlocked = false) => {
    const got = compactStep(state, event, isBlocked)
    return got.state + (got.does ? ' +' + got.does : '')
  }
  // The bug the owner met: Clawd had said he was ready, the owner pressed, and Clawd was asked again
  is('compact: ready + press compacts with the note and sends no prompt', step('ready', 'press'), 'compacting +compact')
  check('compact: no state but idle ever asks Clawd to get ready', ['asking', 'ready', 'waiting', 'compacting'].every((s) => ['press', 'ready', 'work', 'turn', 'clear', 'done', 'failed', 'cancel', 'dismiss', 'timeout'].every((ev) => [false, true].every((b) => compactStep(s, ev, b).does !== 'ask'))), '')
  check('compact: in idle only a press asks', ['ready', 'work', 'turn', 'clear', 'done', 'failed', 'cancel', 'dismiss', 'timeout'].every((ev) => compactStep('idle', ev, false).does !== 'ask'), '')

  is('compact: idle + press asks Clawd', step('idle', 'press'), 'asking +ask')
  is('compact: idle + press asks him whatever blocks', step('idle', 'press', true), 'asking +ask')
  is('compact: idle + ready, unasked, is ready', step('idle', 'ready', true), 'ready')
  for (const ev of ['work', 'turn', 'clear', 'done', 'failed', 'cancel', 'dismiss', 'timeout']) is('compact: idle + ' + ev + ' stays idle', step('idle', ev), 'idle')

  is('compact: asking + ready waits for the turn to end', step('asking', 'ready', true), 'waiting')
  is('compact: asking + cancel lets it go', step('asking', 'cancel'), 'idle +drop')
  is('compact: asking + dismiss lets it go', step('asking', 'dismiss'), 'idle +drop')
  for (const ev of ['press', 'work', 'turn', 'clear', 'done', 'failed', 'timeout']) is('compact: asking + ' + ev + ' goes on asking, once', step('asking', ev, true), 'asking')

  is('compact: ready + press with something in the way waits', step('ready', 'press', true), 'waiting')
  is('compact: ready + ready stays ready (the note is renewed)', step('ready', 'ready'), 'ready')
  is('compact: ready + work is stale', step('ready', 'work'), 'idle +drop')
  is('compact: ready + a new turn is stale', step('ready', 'turn'), 'idle +drop')
  is('compact: ready + dismiss lets it go', step('ready', 'dismiss'), 'idle +drop')
  for (const ev of ['clear', 'done', 'failed', 'cancel', 'timeout']) is('compact: ready + ' + ev + ' stays ready', step('ready', ev), 'ready')

  is('compact: waiting + clear with nothing in the way compacts', step('waiting', 'clear', false), 'compacting +compact')
  is('compact: waiting + clear while blocked goes on waiting', step('waiting', 'clear', true), 'waiting')
  is('compact: waiting + cancel is ready again', step('waiting', 'cancel', true), 'ready')
  is('compact: waiting + timeout is ready again', step('waiting', 'timeout', true), 'ready')
  is('compact: waiting + a new turn is stale', step('waiting', 'turn', true), 'idle +drop')
  is('compact: waiting + dismiss lets it go', step('waiting', 'dismiss'), 'idle +drop')
  is('compact: waiting + work in the turn waited for changes nothing', step('waiting', 'work', true), 'waiting')
  for (const ev of ['press', 'ready', 'done', 'failed']) is('compact: waiting + ' + ev + ' goes on waiting', step('waiting', ev, false), 'waiting')

  is('compact: compacting + done is idle and Clawd gets his note', step('compacting', 'done'), 'idle +resume')
  is('compact: compacting + failed is ready again, the note still good', step('compacting', 'failed'), 'ready')
  for (const ev of ['press', 'ready', 'work', 'turn', 'clear', 'cancel', 'dismiss', 'timeout']) is('compact: compacting + ' + ev + ' goes on compacting', step('compacting', ev), 'compacting')

  // Whole runs
  const run = (events) => events.reduce((state, [ev, b]) => compactStep(state, ev, Boolean(b)).state, 'idle')
  is('compact: asked, ready, turn ends: compacted', run([['press'], ['ready', 1], ['clear', 1], ['clear', 0], ['done']]), 'idle')
  is('compact: unasked ready, press with helpers at work, helpers end', run([['ready', 1], ['press', 1], ['clear', 1], ['clear', 0]]), 'compacting')
  is('compact: a refusal leaves it ready to press again', run([['ready'], ['press'], ['failed'], ['press']]), 'compacting')
  is('compact: ready, then more work, then a press asks afresh', run([['ready'], ['work'], ['press']]), 'asking')
}

// Compaction where a plugin may not compact between turns: the refusal is told from the others
{
  const { needsCommand } = new Function(cut('compactWay') + '\nreturn { needsCommand }')()
  check('compact: the Desktop app\'s refusal asks for the command', needsCommand('clawd-desk: $.session.compact: not available in a headless (-p / SDK) session yet: compaction here runs inside a turn (a /compact prompt); catch it and carry on'), 0)
  check('compact: a refusal while a turn runs does not', !needsCommand('$.session.compact: a turn is running'), 0)
  check('compact: no reason does not', !needsCommand(undefined), 0)
}

// The watcher: who reads, what it reads, what counts as a note, when it reads
{
  const { watcherFor, watchDigest, watchNote, watchDue, WATCH_GAP_MS } = new Function(cut('watch') + '\nreturn { watcherFor, watchDigest, watchNote, watchDue, WATCH_GAP_MS }')()
  const who = (m) => JSON.stringify(watcherFor(m))
  is('watch: Fable is read by Opus thinking little', who('claude-fable-5-1'), '{"model":"opus","effort":"low"}')
  is('watch: Opus is read by Opus thinking little', who('claude-opus-5-5'), '{"model":"opus","effort":"low"}')
  is('watch: Sonnet reads itself', who('claude-sonnet-5-5'), '{"model":"sonnet","effort":"medium"}')
  is('watch: Haiku reads itself, with no effort to set', who('claude-haiku-5-5'), '{"model":"haiku","effort":""}')
  is('watch: a model not yet seen is read by Opus thinking little', who(''), '{"model":"opus","effort":"low"}')

  is('watch: NONE is no note', watchNote('NONE'), '')
  is('watch: none with a full stop is no note', watchNote(' None. '), '')
  is('watch: an empty reply is no note', watchNote(''), '')
  is('watch: a note loses its quotes and line breaks', watchNote('"Claude did not\nrerun the tests."'), 'Claude did not rerun the tests.')
  check('watch: a long note is cut', watchNote('x'.repeat(400)).length === 240, watchNote('x'.repeat(400)).length)
  is('watch: a note that starts with a word like nonetheless is kept', watchNote('Nonetheless the push went out'), 'Nonetheless the push went out')

  const use = (tool, input, text, isError) => ({ tool_use_id: 't', tool, input, ...(text === undefined ? {} : { text }), ...(isError ? { isError: true } : {}) })
  const talk = [
    { role: 'user', text: 'first ask', toolUses: [] },
    { role: 'assistant', text: 'did the first', toolUses: [] },
    { role: 'user', text: 'second ask', toolUses: [] },
    { role: 'assistant', text: 'on it', toolUses: [use('Bash', { command: 'npm test' }, '3 failed', true)] },
    { role: 'user', text: '', toolUses: [], toolResults: [{ tool_use_id: 't', text: '3 failed' }] },
    { role: 'assistant', text: 'All tests pass.', toolUses: [] },
  ]
  const digest = watchDigest(talk)
  check('watch: the digest names the earlier request apart from the turn', digest.startsWith('EARLIER REQUESTS FROM THE OWNER, oldest first:\n- first ask\n\nTHE LAST TURN:\nOWNER: second ask'), digest)
  check('watch: the digest keeps the call, its failed result and the last word', digest.includes('TOOL Bash {"command":"npm test"}\n  -> ERROR 3 failed') && digest.endsWith('CLAUDE: All tests pass.'), digest)
  check('watch: an earlier turn\'s answer is not in the digest', !digest.includes('did the first'), digest)
  check('watch: a tool result is not taken for the owner', !digest.includes('OWNER: \n') && digest.split('OWNER:').length === 2, digest)
  const long = watchDigest([{ role: 'user', text: 'go', toolUses: [] }, ...Array.from({ length: 400 }, (_, i) => ({ role: 'assistant', text: 'step ' + i + ' ' + 'y'.repeat(300), toolUses: [] }))], 5000)
  check('watch: a long turn keeps its start and its end within the limit', long.length < 5400 && long.includes('OWNER: go') && long.includes('step 399') && long.includes('left out'), long.length)
  is('watch: a conversation with no owner message is still a turn', watchDigest([{ role: 'assistant', text: 'hello', toolUses: [] }]), 'THE LAST TURN:\nCLAUDE: hello')

  check('watch: a turn that did nothing is not read', !watchDue(0, 1e9, 0), 0)
  check('watch: a turn that acted is read when the last reading is old', watchDue(2, WATCH_GAP_MS, 0), 0)
  check('watch: a turn soon after a reading is not read', !watchDue(2, WATCH_GAP_MS + 10, 100), 0)
}

// Usage bars: green, then yellow, then red; and how long until a window resets
{
  const { usageColor, contextColor, untilText } = new Function("const RED = 'red', GREEN = 'green'\n" + cut('usageColor').replace(/const YELLOW = '[^']+'/, "const YELLOW = 'yellow'") + '\nreturn { usageColor, contextColor, untilText }')()
  is('usage: nothing used is green', usageColor(0), 'green')
  is('usage: just under three fifths is green', usageColor(0.59), 'green')
  is('usage: three fifths is yellow', usageColor(0.6), 'yellow')
  is('usage: just under 85% is yellow', usageColor(0.849), 'yellow')
  is('usage: 85% is red', usageColor(0.85), 'red')
  is('usage: over the limit is red', usageColor(1.2), 'red')
  is('context: far from compaction is green', contextColor(168000, 400000), 'green')
  is('context: the last quarter before compaction is yellow', contextColor(300000, 400000), 'yellow')
  is('context: at the size to compact it is red', contextColor(400000, 400000), 'red')
  const at = Date.parse('2026-10-12T10:00:00Z')
  is('until: hours and minutes', untilText('2026-10-12T12:14:00Z', at), '2h 14m')
  is('until: minutes alone, rounded up', untilText('2026-10-12T10:37:30Z', at), '38m')
  is('until: days and hours', untilText('2026-10-15T15:00:00Z', at), '3d 5h')
  is('until: a time that is past says nothing', untilText('2026-10-12T09:00:00Z', at), '')
  is('until: no time says nothing', untilText(undefined, at), '')
}

// Clawd's sayings at rest: each fits the bubble, and none comes twice in a round
{
  const { QUOTES, drawQuote, quoteText } = new Function(cut('quotes') + '\nreturn { QUOTES, drawQuote, quoteText }')()
  const { wrapText } = new Function(source.slice(0, source.indexOf('// --- The hooks')) + '\nreturn { wrapText }')()
  // The bubble's text is 322 px wide in a desk of 456; a narrower desk of 400 leaves 266
  const tooLong = QUOTES.map((_, i) => quoteText(i)).filter((q) => wrapText(q, 12, 322, 3).length > 2)
  check('quotes: every saying fits two lines of the bubble', tooLong.length === 0, tooLong)
  check('quotes: every saying has its words and who said them', QUOTES.every((q) => q.length === 2 && q[0].length > 10 && q[1].length > 2), 0)
  is('quotes: no saying is there twice', new Set(QUOTES.map((q) => q[0])).size, QUOTES.length)
  is('quotes: a saying is shown in quotes with its author after it', quoteText(0), '“Well done is better than well said.” Benjamin Franklin')
  is('quotes: an index that is not there says nothing', quoteText(-1), '')
  let deck = []
  let last = -1
  const seen = []
  for (let i = 0; i < QUOTES.length - 1; i++) {
    const drawn = drawQuote(deck, (i * 0.37) % 1, last)
    deck = drawn.deck
    last = drawn.index
    seen.push(drawn.index)
  }
  is('quotes: a round shows no saying twice', new Set(seen).size, seen.length)
  const again = drawQuote(deck, 0, last)
  check('quotes: the round after starts with another than the last', again.index !== last, again.index)
  is('quotes: a pick of 1 takes the last of the deck, not past it', drawQuote([4, 7], 1, -1).index, 7)
}

console.log(passed + ' passed, ' + failed + ' failed')
process.exit(failed ? 1 : 0)
