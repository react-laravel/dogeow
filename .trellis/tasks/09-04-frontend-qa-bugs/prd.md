# Fix DogeOW frontend QA bugs

## Goal

Fix six frontend bugs found in QA on https://next.dogeow.com. No extra scope.

## Acceptance criteria

1. **Notes rich text**
   - List preview shows human-readable plain/excerpt text, never raw TipTap/ProseMirror JSON.
   - Detail page renders editor document (TipTap viewer or markdown), not `(无内容)` when JSON/markdown content exists.

2. **Timestamp tool**
   - Conversion result updates whenever timestamp/date input changes (or clears until valid).

3. **File preview**
   - Correct URL handling / error states for image preview; no useless horizontal scrollbar.
   - If API contract is wrong, document it in PR.

4. **PWA install prompt**
   - On narrow viewports, install prompt does not obscure primary tool cards.

5. **document.title i18n**
   - Browser tab title follows current locale.

6. **Login validation language**
   - Chinese UI does not show English native HTML5 validation tooltips.

## Out of scope

Fill-blank Server Error (API), AI model provisioning, camera permission.
