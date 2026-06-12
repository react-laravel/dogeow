export const COMPARE_EQUIPPED_PANEL_WIDTH = 156
export const COMPARE_NEW_ITEM_PANEL_WIDTH = 200
export const COMPARE_TOGGLE_STRIP_WIDTH = 24

export function getFullComparePanelWidth(collapsed: boolean): number {
  return collapsed
    ? COMPARE_NEW_ITEM_PANEL_WIDTH
    : COMPARE_EQUIPPED_PANEL_WIDTH + COMPARE_NEW_ITEM_PANEL_WIDTH
}

export function getFullComparePanelWidthClass(collapsed: boolean): string {
  return collapsed ? 'w-[200px]' : 'w-[min(356px,calc(100vw-24px))]'
}
