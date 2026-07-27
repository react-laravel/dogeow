# State Management

DogeOW separates remote server state, shared client state, and local component
state. The established tools are SWR, Zustand, and React state respectively.

## State Placement

| State kind                    | Tool and location                            | Repository examples                                                                                         |
| ----------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Cacheable Laravel API data    | SWR hooks plus `lib/api/`                    | `app/word/hooks/useWord.ts`, `components/search/hooks/useSearchData.ts`                                     |
| Cross-route application state | Root Zustand store                           | `stores/authStore.ts`, `stores/themeStore.ts`, `stores/musicStore.ts`                                       |
| Feature-wide client state     | Feature Zustand store                        | `app/word/stores/wordStore.ts`, `app/file/store/useFileStore.ts`, `components/search/stores/searchStore.ts` |
| Transient UI state            | `useState`/`useReducer` in component or hook | sheet state in `app/dashboard/page.tsx`, copy state in `app/about/contact/page.tsx`                         |
| Shareable route selection     | Next navigation/search params                | `section` in `app/dashboard/page.tsx`                                                                       |

Do not introduce React Query or nuqs based on the old template documents; they
are not the current DogeOW state stack.

## Authentication State

Authentication is application state in `stores/authStore.ts`, backed by the
Laravel API:

- login and registration receive a Bearer token and user from Laravel;
- Zustand persistence stores only the user, token, and authentication flag;
- session restoration tries the persisted Bearer token first and can fall back
  to the Laravel session cookie;
- `lib/api/core.ts` includes cookies and adds the store's Bearer token by
  default;
- `lib/api/internal-auth.ts` forwards the same credentials to protected
  same-origin Next.js API routes.

Use the existing store and request helpers. Do not add better-auth, a React
Query session cache, or a second authentication context.

## Zustand Store Shape

Stores use `create<State>()`, keep state and actions in one typed object, and
export a hook named `use*Store`.

`stores/themeStore.ts` is representative:

```ts
interface ThemeState {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      themeMode: 'light',
      setThemeMode: mode => set({ themeMode: mode }),
    }),
    { name: 'theme-storage' }
  )
)
```

Use `set(state => ...)` for updates derived from previous state and `get()` when
one store action must read or invoke current store behavior. Examples include
queue updates in `app/word/stores/wordStore.ts` and authentication lifecycle
actions in `stores/authStore.ts`.

## Persistence

Persist only state that should survive a reload:

- `stores/authStore.ts` uses `partialize` so loading state and actions are not
  persisted, and supplies safe storage behavior for unavailable localStorage.
- `stores/themeStore.ts` versions its persisted shape and migrates older data.
- `app/word/stores/wordStore.ts` persists only `dailyProgress`.
- `components/search/stores/searchStore.ts` persists only search history, not
  transient suggestions.

When changing a persisted schema, update its version/migration or keep the
stored shape backward-compatible. Never persist browser handles, DOM nodes,
loading flags, errors, or derived values.

## SWR and Mutations

SWR owns the cache for remote data. Use stable keys and the centralized helpers
from `lib/api/`. Mutations should update or invalidate SWR cache rather than
copying the same response into a global store.

`components/provider/SWRProvider.tsx` defines application-wide SWR behavior.
Feature hooks such as `app/word/hooks/useWord.ts` define typed keys, fetchers,
pagination, and revalidation details close to the domain.

## Local and URL State

Keep short-lived view state local when no sibling or route needs it. Examples
include dialog/sheet open state, form loading state, and temporary clipboard
feedback.

When the state must survive navigation or be linkable, use Next.js search
params. `app/dashboard/page.tsx` reads `section` with `useSearchParams`, validates
it with `isDashboardSection`, and updates it through `router.push`.

## Observed Inconsistencies and Anti-Patterns

- Feature stores use both `store/` and `stores/` folder names. Match the feature;
  do not create a second store directory for the same domain.
- Some stores contain API orchestration as well as client state. Preserve the
  owning feature's current boundary, but do not add unrelated API cache data to
  a store that SWR already owns.
- Do not use Zustand for one-component booleans or input values.
- Do not mirror one value simultaneously in local state, Zustand, and SWR
  without an explicit synchronization contract.
- Do not persist entire stores by default. Use `partialize` and migrations where
  the persisted shape can evolve.
- Do not access localStorage at module initialization without an SSR-safe
  fallback; `stores/authStore.ts` demonstrates the required guard.
