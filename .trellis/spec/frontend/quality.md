# Frontend Quality Guidelines

Quality checks are defined by the repository configuration, not by generic
package-manager examples. DogeOW uses npm.

## Required Commands

From `package.json`:

```bash
npm run type-check    # tsc --noEmit
npm run lint          # eslint .
npm run format:check  # prettier --check .
npm run test          # vitest --run
npm run check-all     # type-check, lint, format check
npm run build         # Next.js production build
```

Run focused tests while developing, then checks proportionate to the change.
Do not automatically start `npm run dev`; both `CLAUDE.md` and `.cursorrules`
expect development-server startup to remain explicit.

The pre-commit hook runs lint-staged and staged-file TypeScript checks:

- `.lintstagedrc.js` applies ESLint and Prettier to staged JS/TS and Prettier to
  docs/config/CSS.
- `.husky/pre-commit` loads the project Node environment, runs lint-staged, then
  `scripts/precommit-typecheck-staged.mjs`.

## Formatting and Linting

`.editorconfig` and `.prettierrc` establish:

- UTF-8, LF endings, final newline, spaces, and two-space indentation;
- no semicolons;
- single quotes;
- 100-column print width;
- ES5 trailing commas;
- no trailing whitespace (Markdown permits intentional trailing spaces).

ESLint is based on `eslint-config-next`. Fix lint findings at their source.
`CLAUDE.md` explicitly rejects adding `eslint-disable-next-line` as routine
problem-solving.

## Tests

Vitest runs in jsdom with Testing Library and shared setup from
`vitest.setup.tsx`. Tests are colocated in `__tests__`.

Match the test style to the code:

- Component behavior:
  `components/ui/__tests__/button.test.tsx` uses role-based queries and covers
  rendering, variants, interactions, keyboard behavior, disabled state, and
  accessible names.
- Feature component:
  `app/dashboard/components/__tests__/DashboardCard.test.tsx` verifies the
  public rendered contract.
- Hook behavior:
  `hooks/__tests__/usePagination.test.ts` uses `renderHook` and `act` to cover
  state transitions and edge cases.
- Domain utilities:
  `app/book/utils/__tests__/bilingualParse.test.ts` and
  `app/file/components/views/tree/utils/__tests__/treeUtils.test.ts` test pure
  transformations without rendering.
- Infrastructure:
  `lib/api/__tests__/core.test.ts` and store tests exercise request/state
  behavior with mocks at external boundaries.

Prefer queries by role, label, or visible text. Test behavior visible through
the public API rather than private implementation details.

## Accessibility and UX Checks

For changed UI:

- verify keyboard operation and focus behavior;
- give icon-only buttons an accessible name;
- use semantic controls or provide role, tab index, and Enter/Space handling
  for unavoidable composite controls;
- preserve loading, disabled, empty, and error states;
- check the responsive layouts affected by the change.

Existing examples include the accessible button tests in
`components/ui/__tests__/button.test.tsx`, dialog screen-reader fallbacks in
`components/ui/dialog.tsx`, and the keyboard-enabled compound result row in
`components/search/components/SearchResultItem.tsx`.

## Validation by Change Type

| Change                | Minimum focused validation                                           |
| --------------------- | -------------------------------------------------------------------- |
| Documentation only    | Prettier check plus referenced path/link validation                  |
| Pure utility or store | Related Vitest file, type-check, lint changed scope                  |
| Hook or component     | Related Vitest tests, type-check, lint changed scope                 |
| Route/API integration | Related tests, type-check, lint, production build when practical     |
| Shared UI primitive   | Component tests plus affected feature tests and accessibility checks |

## Observed Exceptions and Anti-Patterns

- The test suite contains legacy mocks typed with `any` and a few narrow lint or
  type suppressions. Do not copy them into production code or broad shared test
  helpers.
- Coverage configuration excludes compatibility shells and generated/dependency
  boundaries. Do not interpret an exclusion as permission to skip tests for new
  business logic.
- Do not assert only snapshots or CSS internals when a role, state transition,
  callback, or rendered result expresses the behavior.
- Do not leave `console.log` debugging in production code. Existing
  `console.error`/`warn` calls are deliberate error reporting and should not be
  removed indiscriminately.
- Do not replace focused validation with a dev-server smoke test.
