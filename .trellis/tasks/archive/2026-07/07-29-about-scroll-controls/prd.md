# Fix about page scroll and controls

## Goal

Keep `/about` visually contained within the viewport below the global header and
replace the permanently visible reading-settings card with a compact control
that does not consume content space.

## Background

- `app/about/page.tsx` currently adds `overflow-auto` to the page content
  wrapper.
- Its vertical quote list also uses
  `h-[calc(100dvh-14rem)] min-h-[28rem]`; together with the heading and settings
  card, this can overflow the route shell and create the vertical scrollbar
  shown in the supplied screenshot.
- The current settings card always reserves layout space for font size, text
  color, and direction controls.
- The existing settings persistence contract
  (`dogeow:about-reading-settings`) and all three controls already work and
  must be preserved.

## Requirements

1. The `/about` route shell must fit the available height under the global
   header and must not itself scroll vertically.
2. The quote area must consume only the remaining page height:
   - vertical writing mode scrolls horizontally when needed and never
     vertically;
   - horizontal writing mode may scroll vertically inside the quote area so
     all quotes remain reachable without scrolling the route shell.
3. Replace the always-visible settings card with one compact “阅读设置” button
   beside the “自言自语” heading.
4. Activating the settings button opens an accessible popover containing the
   existing font-size slider, text-color control, and horizontal/vertical
   direction toggle.
5. Preserve the current font-size range, color format validation, localStorage
   key, persistence behavior, writing-mode behavior, and quote content.
6. Keep the change scoped to `/about` and its focused tests; do not alter the
   global layout scroll behavior or redesign other about routes.

## Acceptance Criteria

- [x] At desktop and mobile viewport sizes, `/about` has no page-level vertical
      scrollbar below the global header.
- [x] Vertical quote mode has horizontal overflow only; horizontal quote mode
      keeps any vertical overflow inside the quote list.
- [x] The heading row contains a compact accessible “阅读设置” trigger instead
      of the large inline settings card.
- [x] The popover exposes font size, text color, and direction controls, and
      changing each control immediately updates the quote presentation.
- [x] Saved reading settings still restore from
      `dogeow:about-reading-settings`.
- [x] Focused `/about` tests cover the compact trigger/popover, all three
      settings, and the route/quote overflow class contract.
- [x] Focused tests, changed-file linting, targeted type-checking, formatting, and a
      browser check of `/about` pass.

## Out of Scope

- Changing quote text or typography defaults.
- Changing the global `LayoutRenderer` scroll container.
- Redesigning `/about/contact`, `/about/privacy`, or `/about/terms`.
- Changing how settings are stored or synchronized.

## Key Decisions

- Use the existing Radix-based `Popover` and shared `Button` components rather
  than adding a new control primitive.
- Treat “the route must not scroll” as a page-shell requirement while allowing
  the quote list to scroll in the direction required to keep content
  accessible.
- This is a lightweight, single-page UI fix; `prd.md` is the complete planning
  artifact.
