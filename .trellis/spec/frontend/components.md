# Component Guidelines

DogeOW is a Next.js 16 App Router application using React 19, TypeScript,
Tailwind CSS, Shadcn-style components, and Radix primitives.

## Server and Client Boundaries

Leave files as Server Components when they do not need client-only behavior:

- `app/layout.tsx` exports metadata and composes providers without a
  `'use client'` directive.
- `app/page.tsx` is a small server entry that renders
  `components/app/HomePage.tsx`.

Put `'use client'` at the top of a component that directly uses React state,
effects, browser APIs, or client navigation:

- `app/about/contact/page.tsx` uses state, an effect, and
  `navigator.clipboard`.
- `app/dashboard/page.tsx` uses Zustand, `useSearchParams`, and local sheet
  state.
- `components/ui/dialog.tsx` wraps interactive Radix primitives.

The repository contains many client components because the product is highly
interactive. Do not add `'use client'` mechanically, and do not rewrite an
interactive feature as a Server Component merely to pursue a server-first
ideal.

## Component and Props Shape

Reusable components generally:

1. define a local `*Props` interface,
2. destructure named props,
3. export a named function, and
4. keep feature-specific props beside the component.

`app/dashboard/components/DashboardCard.tsx` is representative:

```tsx
interface DashboardCardProps {
  title: string
  description: string
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}

export function DashboardCard({ title, description, icon: Icon, children }: DashboardCardProps) {
  // ...
}
```

`components/layout/PageContainer.tsx` uses a local interface and a constrained
union for `maxWidth`. `app/ai/features/chat/components/ChatInput.tsx` uses
optional callback props and defaults for a prop-rich reusable input.

Pages use default exports because Next.js requires route entry exports.
Feature components use both named and default exports; match the surrounding
folder. Do not convert export style across unrelated files.

## Composition and Shared UI

- Reuse `components/ui/` primitives instead of creating feature-local buttons,
  dialogs, inputs, and selects.
- Reuse `components/layout/` for page spacing and headings.
- Merge optional Tailwind classes with `cn()` from `@/lib/helpers`.
- UI primitives expose native props. `components/ui/button.tsx` extends
  `React.ComponentProps<'button'>`, adds CVA variants, and forwards remaining
  props.
- Use Radix composition where already supported. The button's `asChild` prop
  allows a link to receive button styling without nesting invalid interactive
  elements.

Complex components are split by responsibility. The chat UI separates
`ChatInput`, `ChatInputImagePreview`, `ChatInputModelRow`, and message list
components. The book reader separates toolbar, settings, chapter heading,
sentence blocks, and narration behavior. Keep orchestration in the parent and
move reusable visual or behavioral units into focused files.

## Memoization

Memoization is selective:

- `ChatInput` uses `React.memo` because it is prop-heavy and rerenders during
  streaming.
- `components/search/components/SearchResultItem.tsx` uses `memo` and assigns a
  `displayName`.
- Simple components such as `DashboardCard` and `ChapterHeading` are plain
  functions.

Do not wrap every component in `memo`. When using `memo` or `forwardRef`, set a
useful `displayName` as the existing components do.

## Accessibility

- Use semantic controls and shared primitives for actions. For example,
  `app/about/contact/page.tsx` uses `Button` and supplies a changing
  `aria-label` for its icon/action.
- Icon-only controls need an accessible name. `components/ui/dialog.tsx`
  provides screen-reader text for its close control and a description fallback.
- Associate fields and validation through the shared form primitives, as in
  `app/nav/components/NavForm.tsx`.
- Compound clickable rows sometimes use `role="button"`, `tabIndex={0}`, and
  Enter/Space handling, as in
  `components/search/components/SearchResultItem.tsx`. Prefer a native button
  when the markup can legally be a button; when it cannot, preserve the full
  keyboard behavior.

## Observed Inconsistencies and Anti-Patterns

- Function declarations, arrow components, named exports, and default feature
  exports all exist. Consistency is local to the folder; a global style rewrite
  is not part of feature work.
- Some legacy components use broad casts or non-semantic clickable containers.
  Treat those as compatibility debt, not examples to copy without their
  keyboard and accessibility safeguards.
- Do not duplicate `components/ui/` primitives inside features.
- Do not pass an untyped prop bag or introduce `any` just to make a component
  reusable.
- Do not add memoization without a rerender reason; it adds comparison and
  callback-stability costs.
