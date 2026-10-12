# Helper rules

The desk shows which model and effort each helper (subagent) runs on. It does not
choose them: Claude does, when it starts the helper. Left alone, a helper inherits the
session's model, so a one-line lookup can run on the most expensive model you have.

These rules make Claude pick the cheapest helper that will do the job. They are the
ones the desk was built alongside, and its costumes follow the same ladder.

## Install

Copy the block below into your global `~/.claude/CLAUDE.md` (every project), or into
one project's `CLAUDE.md`. New sessions follow it; a running session does not.

```markdown
# Helpers (subagents)

- Pick the cheapest model and effort that will get the task right the first time;
  when unsure between two, take the higher. Set both on every helper: an unset
  model inherits the session's, which is usually the most expensive.
  - Lookups, searches, short text, running a command and reporting: Haiku.
  - Mechanical edits, renames, boilerplate, a small isolated fix: Sonnet at low
    or medium.
  - Standard feature work, or a bug with a known cause, in a few files: Sonnet at
    high, or Opus at medium.
  - Delicate multi-file work, design, diagnosis, review: Opus at high.
  - The hardest problems, or when I ask for it: Fable.
- Insight and thoroughness are different needs. A task that needs both is two
  tasks: one helper investigates and writes a precise brief, another carries it out.
- Every helper's brief says: do only what the brief asks; stop and report on an open
  design question instead of guessing; verify your own work; end with a short report
  of what was done, what was checked with the real numbers, and what could not be
  verified.
- Work that matters gets a second helper that tries to find what is wrong with it.
  Send findings back for fixing at most twice; after that, decide yourself or ask.
- Helpers report their steps as they go, so progress is visible.
```

## Check that it works

In a new session, with no model named, send:

```text
Start two subagents at the same time. One writes a haiku about crabs; the other lists five facts about terminals. Each must wait 15 seconds between steps and report progress with the step tool: a plan of three steps first with done 0, then each step as it finishes, with a note naming the step in hand.
```

The Team section should show both helpers as `cadet · Haiku`. If it shows the
session's own model, the rules were not loaded.

## How the costumes map

| Costume | Model and effort |
|---|---|
| cadet | Haiku |
| scholar | Sonnet |
| racer | Opus, low |
| chef | Opus, medium |
| engineer | Opus, high (and Opus with effort unknown) |
| detective | Opus, xhigh or max |
| astronaut | Fable |
| pirate | an Explore helper, on any model |

## Notes

- Written for the Claude 5 family, where Sonnet and Haiku are strong enough for
  everyday helper work and Opus at medium is the default.
- The last rule needs nothing from you while the desk is installed: the desk adds the
  step-reporting instruction to every helper's brief itself.
- The tiers by model and effort are inspired by savvy-flow, which uses Opus and Fable
  only; this ladder adds Sonnet and Haiku.
