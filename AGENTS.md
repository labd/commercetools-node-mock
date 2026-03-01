# Agent Instructions

- This project uses `pnpm`, dont use `npm` or `yarn` to install dependencies or run scripts.
- Never run commands via `npx` or equivalents, instead use the scripts defined in `package.json`.
- Always run `pnpm tsc` after making changes and verify it passes without errors before considering your work done. Fix any type errors you introduce.
- Always run `pnpm test` after making changes and verify all tests pass before considering your work done. Fix any test failures you introduce.
- Always run `pnpm biome check` after making changes and verify it reports no errors before considering your work done. Use `pnpm biome check --write --unsafe` to auto-fix formatting, import ordering, and unused import issues.
