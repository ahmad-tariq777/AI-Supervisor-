# Branching and pull requests (S0-02)

## Branches

| Branch | Purpose | Rules |
| --- | --- | --- |
| `main` | Stable, demo-ready code | Protected. Changes arrive only by pull request from `develop`. |
| `develop` | Integration branch | Protected. Changes arrive only by pull request from `feature/*`. |
| `feature/<task-id>-<short-name>` | One task or a small group of related tasks | Branch from `develop`. Delete after merge. |

Examples: `feature/S1-04-register-endpoint`, `feature/S2-07-profile-page`.

Use `fix/<short-name>` for bug fixes and `hotfix/<short-name>` (branched from `main`) only for urgent repairs to a demo.

## Create the branches

After creating the empty repository on GitHub:

```bash
git init -b main
git add .
git commit -m "chore: initial project structure"
git remote add origin <your-repository-url>
git push -u origin main
git checkout -b develop
git push -u origin develop
```

## Protect the branches on GitHub

Repository Settings, then Branches, then Add branch protection rule. Create one rule for `main` and one for `develop`, each with:

- Require a pull request before merging
- Require at least 1 approval (if you work alone, leave approvals at 0 and still use pull requests)
- Dismiss stale approvals when new commits are pushed
- Block force pushes
- Block deletion

Set the default branch to `develop` under Settings, then General, so new pull requests target it.

## Day-to-day flow

```bash
git checkout develop
git pull
git checkout -b feature/S1-04-register-endpoint
```

Commit small and often. Use this message style:

```
feat(backend): add register endpoint
fix(frontend): show field errors on login
docs: update run steps
chore(ai-service): pin httpx version
```

Push the branch and open a pull request into `develop`. The pull request template in `.github/PULL_REQUEST_TEMPLATE.md` loads automatically. Merge with "Squash and merge" so each task is one commit.

When a sprint is finished and tested, open a pull request from `develop` into `main`.
