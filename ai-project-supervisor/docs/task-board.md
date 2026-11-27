# Task board (S0-11)

The full backlog from the Agile Task Plan is in [backlog.csv](backlog.csv): every task with its sprint, module, type, estimated hours and priority.

## Set up a GitHub Project

1. In the repository, open Projects, then New project, then Board.
2. Name it "AI Project Supervisor".
3. Columns: Backlog, Todo, In progress, Review, Done.
4. Add custom fields: Sprint (text), Module (text), Type (single select: OPS, BE, FE, AI, DOC, and any other values in the CSV), Hours (number), Priority (single select: Must, Should, Could).
5. Import the tasks: GitHub Projects has no direct CSV import, so create issues in bulk with the GitHub CLI:

```bash
python docs/create_issues.py
```

Review the script output first; it only prints the commands unless you pass `--run`.

## Using Trello or Jira instead

Both can import `backlog.csv` directly. Map the columns: ID and Task to the card title, Sprint to a label or sprint field, Priority to priority, Hours to estimate.

## Working rules

- Work on Must tasks first within each sprint.
- Drop Could and Should tasks first if time runs short, never the Must tasks of the core lifecycle.
- One task, one branch, one pull request.
