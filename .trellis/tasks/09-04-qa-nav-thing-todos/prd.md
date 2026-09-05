# Fix live QA bugs (thing nav, dashboard menu, todos, i18n, reader)

## Goal

Fix new QA bugs on https://next.dogeow.com without reworking PR #41.

## Must fix

1. `/thing` item card click opens detail (navigate to `/thing/[id]`).
2. Home account menu 「进入仪表盘」 navigates to `/dashboard`.

## Include if straightforward

3. Todos: per-item delete.
4. Category delete confirm dialog in Chinese.
5. Reader 「返回首页」 navigates promptly.

## Out of scope

Word quiz (covered by PR #41).
