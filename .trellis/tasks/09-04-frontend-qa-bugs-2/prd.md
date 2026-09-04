# Frontend QA bugs batch 2 (UI/UX + functional)

## Goal

Fix newly reported design/QA bugs on next.dogeow.com without redoing PR #39 work.

## Scope

Items 1–14 as listed in the agent task / follow-up.

## Notes

- Locale store already works; `/nav` (and related chrome) needed `t()` wiring.
- Word search “hello” may still miss if API lacks the word — frontend now preserves query + empty-state feedback.
- Quiz corpus load is still multi-request; frontend adds 20s overall timeout + error/retry UX. Dedicated quiz API would be better long-term.
