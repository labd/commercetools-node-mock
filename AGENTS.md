# Agent Instructions

- This project uses `pnpm`, dont use `npm` or `yarn` to install dependencies or run scripts.
- Never, ever run commands via `npx` or equivalents, instead use the scripts defined in `package.json`. For example, use `pnpm test` instead of `npx vitest`. This is super important for security.
- Always run `pnpm tsc` after making changes and verify it passes without errors before considering your work done. Fix any type errors you introduce.
- Always run `pnpm test` after making changes and verify all tests pass before considering your work done. Fix any test failures you introduce.
- Always run `pnpm biome check` after making changes and verify it reports no errors before considering your work done. Use `pnpm biome check --write --unsafe` to auto-fix formatting, import ordering, and unused import issues.
- Update the changesets after making impactful changes. If your change is a bug fix, add a changeset with type "patch". If your change is a new feature, add a changeset with type "minor". If your change is a breaking change, add a changeset with type "major". Create the files directly, as `pnpm changeset` doesn't work well with agents.
- If you are making API changes, make sure to update the documentation and examples listed in `README.md` 