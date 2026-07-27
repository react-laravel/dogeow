# DogeOW Frontend Development Guidelines

These documents describe the conventions observed in this repository. They are
the source of truth for frontend implementation and review; they supersede the
generic Next.js template assumptions that shipped with the Trellis scaffold.

## Actual Stack

- Next.js 16 App Router and React 19
- TypeScript in strict mode
- Tailwind CSS with Shadcn-style and Radix UI primitives
- Zustand for shared client state
- SWR for cacheable Laravel API state
- Central Laravel and authenticated same-origin API helpers in `lib/api/`
- React Hook Form and Zod for validated forms
- Vitest, jsdom, and Testing Library for tests
- npm as the enforced package manager

## Authoritative Scope

For ordinary DogeOW frontend work, use only the canonical files in the table
below. The scaffold files `api-integration.md`, `orpc-usage.md`,
`authentication.md`, `ai-sdk-integration.md`, and `css-layout.md` are generic
template references and are not DogeOW conventions. In particular, do not
introduce oRPC, React Query, better-auth, Ably, pnpm, or a monorepo package
layout from those documents.

If the root `.trellis/spec/README.md` links to one of those template files,
this frontend index takes precedence. A task may use a template file only after
it has been separately rewritten and validated against current DogeOW code.

## Canonical Guidelines

| File                                               | Covers                                               | Priority                 |
| -------------------------------------------------- | ---------------------------------------------------- | ------------------------ |
| [directory-structure.md](./directory-structure.md) | Route/feature colocation and shared directories      | Must read                |
| [components.md](./components.md)                   | Client boundaries, props, composition, accessibility | Must read                |
| [hooks.md](./hooks.md)                             | Hook location, contracts, cleanup, SWR patterns      | Must read for hooks      |
| [state-management.md](./state-management.md)       | Zustand, SWR, local state, persistence               | Must read for state      |
| [type-safety.md](./type-safety.md)                 | Strict TypeScript, type location, narrowing, forms   | Must read                |
| [quality.md](./quality.md)                         | Formatting, tests, linting, validation               | Must read before handoff |

## Pre-Development Checklist

Before changing frontend code:

1. Read `directory-structure.md` and the guideline for the layer being changed.
2. Search the owning feature and inspect two or three nearby implementations.
3. Reuse an existing shared component, hook, store, API helper, or type when it
   already owns the responsibility.
4. Identify whether data is remote SWR state, shared Zustand state, URL state,
   or local UI state.
5. Plan focused tests and the validation commands required by `quality.md`.

## Core Routing Rules

- Feature-only code stays under its route/feature in `app/`.
- Cross-feature UI belongs in `components/`; cross-feature hooks in `hooks/`;
  cross-feature client state in `stores/`; shared infrastructure in `lib/`.
- Use `@/` for cross-tree imports and relative imports within a feature.
- Use SWR plus `lib/api/` for Laravel API data.
- Use Zustand for shared client state, with selective persistence.
- Keep transient UI state local.
- Use the shared UI primitives and preserve accessibility behavior.
- Treat existing inconsistency as context, not as a license for unrelated
  cleanup.

## API and Authentication Boundaries

- The backend is Laravel, not oRPC. Browser requests use `lib/api/core.ts`,
  which sends cookies and, by default, the Bearer token from
  `stores/authStore.ts`.
- Authentication is owned by `stores/authStore.ts`. It supports Laravel
  email/password registration and login, GitHub OAuth redirection, persisted
  SPA tokens, cookie-session restoration, and logout.
- Protected same-origin Next.js API requests use
  `lib/api/internal-auth.ts` so the current Bearer token is forwarded while
  cookies remain included.
- Next.js route handlers enforce access with
  `app/api/_lib/auth-guard.ts`, which validates the Bearer token or Laravel
  session cookie against the backend.
- Do not create a better-auth client, React Query session cache, or parallel
  authentication context.

## Source Evidence

These guidelines were bootstrapped from `CLAUDE.md`, `.cursorrules`,
`.editorconfig`, `.prettierrc`, `tsconfig.json`, `eslint.config.js`,
`package.json`, the pre-commit/Vitest configuration, and representative code in
`app/book/`, `app/word/`, `app/note/`, `app/file/`, `app/ai/`, `components/`,
`hooks/`, `stores/`, and `lib/`. Authentication and request-boundary guidance
was checked against `stores/authStore.ts`, `lib/api/core.ts`,
`lib/api/internal-auth.ts`, and `app/api/_lib/auth-guard.ts`.

**Documentation language:** English.
