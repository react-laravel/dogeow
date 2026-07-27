# Type Safety

DogeOW uses TypeScript strict mode. `tsconfig.json` enables `strict`,
`isolatedModules`, and `noEmit`, and maps `@/*` to the repository root.

## Where Types Live

Place types at the narrowest shared scope:

- Component-only props stay in the component:
  `DashboardCardProps` in
  `app/dashboard/components/DashboardCard.tsx`.
- A feature with a few shared types uses `types.ts`:
  `app/dashboard/types.ts`, `app/ai/features/chat/types.ts`,
  `components/search/types.ts`.
- A feature with several type domains uses a `types/` directory:
  `app/book/types/reader.ts`, `app/note/types/`.
- Shared API envelopes and pagination types live in `lib/types/api.ts`.
- Global declaration augmentation belongs in `types/global.d.ts` or
  `types/vitest.d.ts`.

Do not create a root type for a shape owned by one feature.

## Type Shapes

The repository commonly uses:

- `interface` for object contracts and props;
- string literal unions for finite UI/domain states;
- `as const` plus indexed access for a runtime list and matching union;
- generics for reusable helpers and API response types;
- `unknown` at untrusted boundaries, followed by narrowing.

`app/dashboard/types.ts` derives its section type from the runtime list:

```ts
export const DASHBOARD_SECTIONS = ['home', 'location', 'logs', 'cache', 'ollama'] as const
export type DashboardSection = (typeof DASHBOARD_SECTIONS)[number]
```

`app/book/types/reader.ts` composes settings with intersections and constrained
unions. `lib/types/api.ts` uses generic response envelopes with `unknown`
defaults rather than `any`.

## Imports and Inference

Use `import type` when an import exists only for the type system. This is common
in `app/layout.tsx`, `components/app/HomePage.tsx`,
`components/search/components/SearchResultItem.tsx`, and `lib/api/core.ts`.
Combined value/type imports such as
`import { cva, type VariantProps } from 'class-variance-authority'` are also
established.

Let TypeScript infer local values and simple callback returns. Add explicit
types at exported contracts, generic boundaries, external data, and complex
hook/store returns.

## Forms and Runtime Validation

React Hook Form and Zod are the established validated-form stack.
`app/thing/components/forms/formConstants.ts` defines `itemFormSchema` and
derives `ItemFormSchemaType` with `z.infer`; `ItemFormWrapper.tsx` passes that
type to `useForm`.

`app/nav/components/NavForm.tsx` currently keeps a handwritten `FormData` next
to a Zod schema. That is an observed older pattern, not evidence that duplicate
schema/type definitions are required. Within an existing form, follow its local
pattern; for a new schema-backed form, derive the type from the schema when the
runtime and TypeScript shapes are intended to match.

## Narrowing External Data

- API helpers are generic and centralize response handling in `lib/api/`.
- `stores/authStore.ts` narrows `UserPayload` with a type predicate before
  reading wrapped fields.
- `app/dashboard/types.ts` validates a URL string before treating it as
  `DashboardSection`.
- Persist migrations in `stores/themeStore.ts` begin with
  `Record<string, unknown>` and narrow fields.

Use `error instanceof Error` before reading `message`. Validate or narrow
unknown API, storage, URL, and third-party data before using it.

## Observed Exceptions and Anti-Patterns

Strict mode does not mean the current repository has zero escape hatches.
There are legacy `any` casts in `lib/store/createAsyncStore.ts`, editor
integration files, tool component registries, and test mocks. They are existing
compatibility debt, not the default for new domain code.

- Do not spread `any` through new public interfaces when `unknown`, a generic,
  or a small adapter type can contain the boundary.
- Do not add `@ts-ignore`. Tests contain narrow `@ts-expect-error` cases to
  simulate impossible browser/server states; keep such exceptions local and
  explanatory.
- `CLAUDE.md` says not to add `eslint-disable-next-line`; fix the underlying
  type/hook issue. A few existing narrow exceptions are not precedent.
- Avoid blind `as SomeType` assertions on API or storage data. Prefer a schema,
  type guard, or explicit property checks.
- Do not maintain duplicate backend response types in multiple feature files;
  use the existing shared API type or the feature's single boundary type.
