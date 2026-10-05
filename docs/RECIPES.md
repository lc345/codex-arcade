# Creating a Recipe

A recipe is the small ecosystem unit of FinalButton. It describes the presenter language for one action family; it does not carry provider credentials or execute a side effect.

```json
{
  "id": "calendar-create",
  "label": "Calendar invite",
  "category": "calendar.create",
  "risk": "medium",
  "holdMs": 1200,
  "tone": "calendar",
  "card": {
    "title": "Book a 30 min demo",
    "summary": "Create a calendar event for Thursday at 14:00.",
    "target": "Alex Chen and Youze",
    "impact": "A calendar invite and notifications will be sent.",
    "rollback": "The event can be cancelled afterward."
  }
}
```

Use a stable `category`, a positive `holdMs`, and direct copy that answers what, whom, impact and rollback. Never put credentials, personal contact data, raw request bodies, or model prompts in a committed recipe.

Run `node packages/core-ts/src/cli.ts verify recipes` before opening a pull request.
