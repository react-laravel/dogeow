Original prompt: 如何给dogeow目录下，url为/game/rpg的技能加音效，不同技能不同音效，你能生成吗？还是有其他网站 可以生成

2026-03-04

- Added per-skill sound manifest and registry for RPG combat skills.
- Wired BattleArena to play skill-specific audio from `skillUsed` events via `soundManager.playSkill`.
- Added a deterministic Node-based WAV generator and generated placeholder files under `public/game/rpg/sfx/skills`.
- Added Vitest coverage for manifest lookup behavior.
- Documented generation workflow and external AI/library options in `docs/rpg-skill-sfx-prompts.md`.
- Verified generated WAV headers and registry tests; TypeScript check passed.

TODO

- Confirm `/game/rpg` loads and does not regress with the new sound preload/runtime path.
- If needed, replace placeholder WAVs with higher-quality AI-generated or licensed assets using the documented prompts.

2026-03-10

- Investigated local `/api/rpg/combat/start` latency; frontend only waits for POST success and already shows a loading state.
- Tightened frontend feedback for combat start by optimistically setting `isFighting` during the request so the arena immediately shows a pending combat state, then rolling back on failure.
- Found the main local delay in `dogeow-api`: `composer run dev` starts `queue:listen`, which spawns one-off workers with `--sleep=3`, so the first combat job can wait before being picked up.
- Found a second delay source: `GameCombatUpdate` and `GameInventoryUpdate` were queued broadcasts, so combat rounds and Reverb push each incurred queue latency.
- Updated backend events to broadcast immediately and changed local dev queue startup to `queue:work --sleep=1` to reduce first-feedback delay.

2026-07-07

- Updated `/game/monopoly` layout handling so the route keeps the app toolbar but disables the main scroll container and removes content padding for the game surface.
- Changed the Monopoly board from a fixed `9/7` ratio to a container-measured layout that chooses the best 28-tile perimeter shape (`11x5`, `10x6`, `9x7`, `8x8`, `7x9`, `6x10`, or `5x11`) while keeping every tile square.
- Replaced the game page's internal `100dvh` height with `h-full` so the top toolbar height is not double-counted and vertical scroll is not introduced below a fixed/sticky header.
- Added tests for the Monopoly fullscreen route behavior and adaptive board layout selection.
- Verified with `npx eslint app/game/monopoly components/themes/LayoutRenderer.tsx components/themes/__tests__/LayoutRenderer.test.tsx` and `npx vitest --run app/game/monopoly/__tests__/Dice.test.tsx app/game/monopoly/__tests__/MonopolyBoard.test.tsx components/themes/__tests__/LayoutRenderer.test.tsx`.
- Playwright MCP could open the local app, but the unauthenticated browser session redirected `/game/monopoly` to `/`, so direct gameplay screenshots were not captured in this session.
- Restored scrolling for the Monopoly landing/room list by removing route-level `overflow-hidden`; app-level scroll is now locked only while a room/board is mounted.
- Moved waiting-room host actions into the board center: "创建机器人" and "开始游戏"; hidden dice, assets, and event log actions before the game starts.
- Added extra game-surface padding so portrait layouts have breathing room when width allows.
- Split the waiting-room center UI from the in-game center UI: waiting rooms no longer show round/current-player or money cards, and instead show the match name, player count, role-only player chips, and host start controls.
- Reworked board layout selection to dynamically generate all perimeter layouts that can contain the board tiles, with a portrait bias toward fewer columns/more rows so vertical screens do not keep too many horizontal tiles.
- Changed the mounted Monopoly board view to a fixed viewport surface below `--app-header-total-height`, so the board uses the full visible game area instead of inheriting a short parent height.
- Updated board layout selection to prioritize full height in portrait and full width in landscape, with a minimum side length of 5 to keep the center panel usable.
- Removed outer game-surface padding so the board can reach the left and right screen edges while retaining its internal tile gaps/border.
- Made the mounted board surface explicitly use `height: calc(100dvh - var(--app-header-total-height))` and centered waiting-room match/player/action content.
- Removed the outer board container border/background/shadow so only individual tiles frame the board.
- Replaced tile highlight rings with inset shadows so edge tiles still show all highlight sides when the board touches the viewport edge.
- Changed waiting-room host action buttons to wrapping flex buttons with minimum widths so "创建机器人" does not overflow in narrow center panels.
- Updated Monopoly initial player cash from 800K to 8M and synced backend/frontend tests.
- Added an in-turn "盖房" action when the current player lands on their own city tile, building one house directly from the main action panel.
- Expanded Monopoly chance and welfare card pools with more random cash, movement, jail, and jail-card outcomes; added clear logs for positive cash rewards and jail-card rewards.
- Added a latest chance/welfare result panel to the main action area so drawn cards are visible without opening the event log.
- Updated city pricing: 14 cities now run from 100K through 1.4M, houses cost 500K each, and city rent is 10% of land plus built house value; API state now includes `current_rent` for frontend display.
- Added a 30-round default Monopoly end condition: if no one is eliminated by then, the API finishes the game by net worth (cash + land + houses), logs standings, and the frontend shows a finished result panel instead of waiting for another turn.
- Added a large Monopoly rules dialog from the board center controls and changed in-game player cards to show total assets instead of current tile position.
- Removed the separate "我的资产" action button; player asset cards are now clickable and open a per-player asset view with cash, owned asset value, net worth, and per-property total value.
- Confirmed the property board game appears on `/game` and changed user-facing names from Monopoly/大富翁 to "地产棋局" / "Estate Circuit" to avoid trademarked naming.
- Removed the lobby refresh button and switched room list/count updates to a `monopoly.lobby` WebSocket broadcast from the API.
- Removed the separate event-log view/button; the main action panel now shows a scrollable event feed beneath the controls that fills remaining center-panel height.
- Moved the estate game rules dialog to the `/game` entry card and removed in-game rules/action-status text from the board center panel.
- Reworked the in-game center panel for landscape: controls/current tile stay on the left while the event feed becomes a dedicated scrollable right-side column; portrait remains stacked.
- Delayed event-log updates until movement animations finish and locked player actions while dice/movement animation is running.
- Enforced the per-turn 2-house build limit in the API and hid frontend build controls once the current player reaches that turn limit.
- Cleaned up the estate game frontend by centralizing house-limit constants, adding current-player emphasis, exposing remaining build quota on owned tiles, and adding empty states for room/event lists.
- Updated portrait board layout selection to maximize visible board area so side tiles align closer to screen edges, and compacted player cards to show cash/net worth on one line.
- Updated backend turn flow so rolls that leave no follow-up action auto-advance the turn, and paying to leave jail immediately ends the current turn.
- Raised city land prices from 200K through 2.8M and changed city rent to 20% of land plus house value.

2026-07-10

- Reworked estate-game turn presentation into a queued sequence: each player now rolls first, moves one tile at a time, then reveals cash, property, event-log, and next-player updates after landing.
- Added API animation snapshots for human and computer rolls; ending a turn or paying to leave jail now returns all following computer roll steps instead of only the final state.
- Broadcast every computer dice roll and turn advance so all connected players see the same ordered animation flow.
- Improved dice motion, moving-token hop/highlight effects, landing feedback, active-player cards, event accents, and compact property information.
- Added `render_game_to_text` and deterministic animation stepping hooks for automated game inspection.
- Verified 390x844 portrait and 1180x720 landscape layouts with no document overflow; completed a human plus three-computer round with no new browser console errors.
- Verified frontend ESLint and 5 focused Vitest assertions; verified backend Pint, PHPStan, and 9 Monopoly feature tests with 76 assertions.

TODO

- Consider adding optional sound effects once final audio assets are available.

2026-07-10

- Reworked the RPG combat screen into a responsive battlefield plus operations sidebar, keeping the arena compact on desktop and readable on mobile.
- Added clearer combat state, round, map, character HP/MP, skill enable/cooldown, and combat-log hierarchy.
- Added battlefield depth, idle motion, hit/regen number animation, skill-cast feedback, cooldown motion, bar sheen, and reduced-motion fallbacks.
- Replaced RPG tab emoji with consistent Lucide icons.
- Added battle-control regression coverage and verified the resulting layout at 1440px desktop and 390px mobile viewports with Playwright screenshots.

TODO

- Verify the authenticated live combat data flow in a signed-in browser, including repeated use of the same skill on consecutive rounds.

2026-07-10

- Current prompt: 改进代码，提取组件化。
- Split `/game/monopoly` presentation into dedicated lobby, waiting-room, active-game, finished-game, asset, event-log, and animation-style components.
- Kept API calls, WebSocket subscriptions, state ownership, and animation sequencing in `MonopolyGameClient` so the extracted panels remain presentational.
- Centralized the house-limit constants and reduced `MonopolyGameClient.tsx` from 1,166 to 686 lines.
- Added panel interaction coverage; all 9 focused Monopoly tests and targeted ESLint checks pass.
- The full repository type-check remains blocked by pre-existing test typing failures outside `app/game/monopoly`; no Monopoly type errors were reported.
- Ran the required Playwright game client and inspected its screenshot. The fresh browser was redirected to the public home page because it was unauthenticated, so authenticated board visuals could not be re-captured in this run.

TODO

- Re-run the `/game/monopoly` browser pass in an authenticated session if visual confirmation of the refactored panels is required.
