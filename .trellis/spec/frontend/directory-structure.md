# Frontend Directory Structure

This document records the structure that exists in DogeOW. It is not a proposal
to move the project into a `src/`, `features/`, or `modules/` tree.

## Application and Feature Code

DogeOW uses the Next.js App Router directly under `app/`. Route files and code
owned by a route are colocated:

```text
app/
├── book/
│   ├── [bookId]/page.tsx
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── utils/
├── file/
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── services/
│   └── store/
├── note/
│   ├── components/
│   ├── hooks/
│   ├── store/
│   ├── types/
│   └── utils/
└── ai/features/chat/
    ├── components/
    ├── hooks/
    ├── types.ts
    └── request-model.ts
```

Representative implementations:

- `app/book/` keeps reader components, narration hooks, reader types, and parsing
  utilities next to the book routes.
- `app/file/` keeps file UI, operations hooks, services, and
  `store/useFileStore.ts` within the feature.
- `app/ai/features/chat/` uses an additional `features/chat` level because AI
  has multiple sub-features; its components and hooks remain colocated.
- Large features such as `app/note/` and `app/thing/` use deeper subfolders when
  a real domain boundary exists.

Add code to the owning feature when only that feature uses it. Do not create a
parallel top-level module merely to make the tree look uniform.

## Shared Code

Code used by multiple features lives at the repository root:

| Directory                    | Existing responsibility                          | Examples                                  |
| ---------------------------- | ------------------------------------------------ | ----------------------------------------- |
| `components/ui/`             | Low-level Shadcn/Radix-style primitives          | `button.tsx`, `dialog.tsx`, `select.tsx`  |
| `components/layout/`         | Shared page layout                               | `PageContainer.tsx`, `PageHeader.tsx`     |
| `components/provider/`       | Application providers                            | `SWRProvider.tsx`, `LanguageProvider.tsx` |
| `components/app/`            | Cross-route application UI                       | `HomePage.tsx`, `ThemeProvider.tsx`       |
| `hooks/`                     | Cross-feature hooks                              | `usePagination.ts`, `useAutoSave.ts`      |
| `stores/`                    | Cross-feature Zustand state                      | `authStore.ts`, `themeStore.ts`           |
| `lib/api/`                   | Central Laravel/internal API clients             | `core.ts`, `swr.ts`, `internal-auth.ts`   |
| `lib/helpers/`, `lib/utils/` | Shared pure helpers and infrastructure utilities | `dateUtils.ts`, `storage.ts`              |
| `types/`                     | Project-wide declaration augmentation            | `global.d.ts`, `vitest.d.ts`              |

Move code into these shared locations only after it has more than one real
consumer. Feature-specific types remain beside the feature, for example
`app/dashboard/types.ts` and `app/book/types/reader.ts`.

## Tests

Tests are colocated in `__tests__` directories adjacent to the code:

- `app/book/components/__tests__/ReaderToolbar.test.tsx`
- `app/file/hooks/__tests__/useFileOperations.test.ts`
- `hooks/__tests__/usePagination.test.ts`
- `stores/__tests__/authStore.test.ts`
- `lib/api/__tests__/core.test.ts`

Use the same pattern for new tests. The Vitest include pattern in
`vitest.config.ts` discovers `**/__tests__/**/*.{test,spec}.*`.

## Naming and Imports

- Components use PascalCase filenames: `DashboardCard.tsx`,
  `ChapterHeading.tsx`.
- Hooks use a `use` prefix: `useBookNarration.ts`, `useAiChatImages.ts`.
- Stores are named `*Store.ts`, with both `store/` and `stores/` feature folder
  spellings present. Match the owning feature instead of renaming unrelated
  folders.
- Utilities and services use camelCase filenames such as `bookMarks.ts` and
  `treeUtils.ts`.
- Use the `@/` alias for cross-tree imports; `tsconfig.json` maps `@/*` to the
  repository root.
- Relative imports are normal within one feature folder.
- Barrel files are selective, not mandatory. `components/layout/index.ts`,
  `app/dashboard/components/index.ts`, and
  `app/ai/features/chat/components/index.ts` expose intentional public groups;
  `components/ui/button.tsx` is commonly imported directly.

## Observed Inconsistencies and Anti-Patterns

- The repository has both singular `store/` and plural `stores/` inside
  features. This is existing inconsistency, not a reason to create duplicate
  stores or perform drive-by renames.
- Do not introduce the generic `modules/[feature]` layout from old templates;
  it does not exist in DogeOW.
- Do not move route-owned code into root `components/`, `hooks/`, or `stores/`
  before it is genuinely shared.
- Do not force a barrel export for every folder. Add or update a barrel only
  where that folder already presents a public grouped API.
- Avoid generic dumping grounds. Put domain-specific helpers in the feature's
  `utils/` or `services/`, and reserve root `lib/` for shared infrastructure.
