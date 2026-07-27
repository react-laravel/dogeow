# Hook Guidelines

Custom hooks live beside their consumers when feature-specific and in root
`hooks/` when shared by multiple features.

## Location and Naming

- Shared: `hooks/usePagination.ts`, `hooks/useAutoSave.ts`,
  `hooks/useTranslation.ts`.
- Feature-local: `app/book/hooks/useBookNarration.ts`,
  `app/file/hooks/useFileOperations.ts`,
  `app/ai/features/chat/hooks/useAiChatImages.ts`.
- A complex hook may have a folder of focused helpers. The launcher uses
  `components/launcher/hooks/useAudioPlayback/` for lifecycle, media source,
  controls, volume, and visibility concerns.

Hook files and exported hooks use the `use` prefix. Pure helpers used by hooks
do not: `app/ai/features/chat/hooks/chatStream.ts` and
`browserOllama.ts` are ordinary modules.

## Inputs and Return Values

Use an options interface when a hook has several related inputs and a named
return interface for a non-trivial public contract. Examples:

- `hooks/useAutoSave.ts` defines generic `UseAutoSaveOptions<T>` and
  `UseAutoSaveReturn<T>`.
- `app/ai/features/chat/hooks/useAiChatImages.ts` defines options for enablement,
  image limits, and upload behavior and returns named state/actions.
- `hooks/usePagination.ts` exposes `UsePaginationReturn`.

Return named objects rather than positional tuples for multi-action feature
hooks. Small hooks that naturally mirror a library primitive may use the
library's return shape.

## Callback Stability and Effects

Use `useCallback` for actions returned to consumers or used in dependency
arrays. `usePagination` stabilizes page actions, and `useAiChatImages`
stabilizes upload, removal, and cleanup operations.

Effects that acquire resources must release them:

- `useAutoSave` clears its timeout on unmount.
- `useAiChatImages` revokes object URLs when images are removed and when the
  hook unmounts.
- `app/ai/features/knowledge/hooks/useKnowledgeIndexStatus.ts` leaves the Echo
  channel in its effect cleanup.

Keep dependency arrays complete. `CLAUDE.md` explicitly requires fixing the
underlying lint issue instead of suppressing hook rules.

## Remote Data Hooks

SWR is the default remote-data hook:

```ts
export const useBook = (id: number) => useSWR<Book>(id ? `/word/books/${id}` : null, fetcher)
```

Patterns in `app/word/hooks/useWord.ts` and
`app/ai/features/knowledge/hooks/useKnowledgeIndexStatus.ts`:

- use a stable string as the cache key;
- pass `null` to disable a request until prerequisites exist;
- type the response at the hook boundary;
- call the centralized API helpers from `lib/api/`;
- use `useSWRInfinite` for paginated infinite data;
- expose derived flags such as `isLoadingMore` and `isReachingEnd` from a
  feature hook when callers need them.

Do not add raw `fetch` or Axios to a feature hook for Laravel API traffic.
Internal Next.js routes use the authenticated internal request helper where
needed.

## Scope and Decomposition

Hooks own reusable behavior, not presentation markup. Keep a hook focused:

- `useBookNarration` owns narration state and lifecycle.
- `useBookTextSelectionActions` owns selection actions.
- `useAiChatImages` owns image selection/upload cleanup, not the chat renderer.

If one hook becomes a lifecycle coordinator, split pure helpers and focused
sub-hooks while keeping a stable public entry point, as the launcher audio
hook does.

## Observed Inconsistencies and Anti-Patterns

- Some hook files include `'use client'` and others rely on being imported by a
  client component. Match the local area; add the directive when the hook is a
  direct client boundary, not as a bulk cleanup.
- Some older feature files combine fetchers, mutations, constants, and many SWR
  hooks (notably `app/word/hooks/useWord.ts`). Do not use that size as a target
  for new unrelated behavior.
- Do not hide effect dependencies with ESLint suppression.
- Do not leave timers, subscriptions, object URLs, media listeners, or Echo
  channels active after unmount.
- Do not duplicate remote API results into Zustand merely to avoid using SWR.
