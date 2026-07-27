# DogeOW Development Specifications

DogeOW is a single-repository Next.js 16 and React 19 frontend backed by
Laravel APIs. The frontend uses strict TypeScript, Tailwind CSS, Zustand for
shared client state, SWR for remote data, React Hook Form with Zod for validated
forms, and npm for project commands.

## Project Conventions

Start with the [frontend guideline index](./frontend/index.md), then read the
documents relevant to the change:

- [Directory structure](./frontend/directory-structure.md)
- [Components](./frontend/components.md)
- [Hooks](./frontend/hooks.md)
- [State management](./frontend/state-management.md)
- [Type safety](./frontend/type-safety.md)
- [Quality and validation](./frontend/quality.md)

These frontend documents are the verified DogeOW conventions. They are grounded
in the repository's existing convention files, configuration, and production
code.

## Scaffold References

Generated backend, shared, guides, big-question, and noncanonical frontend
template documents remain scaffold references. They are not DogeOW project
conventions and must not be routed into implementation or review unless they
are separately validated against the current repository.
