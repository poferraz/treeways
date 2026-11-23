# Treeways contributor instructions

Use the checks in [Contributing](CONTRIBUTING.md) and the recorded [release gates](docs/release-gates/). Changes to published trails also follow the [trail review guide](docs/trail-review-guide.md).

## Commits and review

- Commit each verified milestone as one coherent change or a short sequence of changes.
- Push the verified work to its branch on `origin` at session end. The default branch is `main`.
- The Stop hook in `.claude/settings.json` warns when the working tree has more than 15 uncommitted files. If the milestone has passed its checks, commit the completed work. Work in progress can stay in the working tree.

The maintainer has authorized commits at completed milestone gates and pushes to the working branch. Other commits require the maintainer’s direction.
