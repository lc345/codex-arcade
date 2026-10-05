# Branching Cartoon Patterns

## Episode card

```text
title:
visual grammar:
hook: what is visibly unusual in the first second?
fork A / fork B: two actions with different locations or consequences
third beat: what each route reveals
quiet loop: stable tableau while the agent still works
cut-away: the neutral image shown when the turn ends
```

## Borrowed ideas, adapted for Agent Stage

- Story Skills: keep durable story state explicit, so a serial does not contradict its earlier routes. Agent Stage keeps this state local, tiny, and unrelated to agent work.
- Video storyboard practice: establish a visual hook, then a readable choice, then a consequence. The Dock uses 2D Canvas rather than a generated remote video.
- The product safety contract wins over story structure: an ongoing turn has no known percentage or outcome.

Sources for the methods: [Story Skills](https://github.com/danjdewhurst/story-skills) and [AI Video Storyboard Skill](https://github.com/aicontentskills/ai-video-storyboard-skill). These are influences, not runtime dependencies or copied pack content.

## Route tests

- Each available route changes a visible scene or pose.
- A `longPress` or unknown gesture has no effect unless explicitly designed and taught.
- Routes never access `ActivityEvent` fields beyond opaque IDs and generic lifecycle metadata.
- Finishing a turn fades the episode regardless of route.
