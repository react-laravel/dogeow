# Fix note graph labels / zoom affordances

## Goal

After #41, live graph shows links but almost no readable labels and no clear zoom controls. Restore a usable default view and visible pan/zoom affordances without abandoning anti-overlap LOD.

## Acceptance

1. Default/fit zoom shows a reasonable number of readable node labels.
2. Visible zoom in / out / fit controls + scroll/drag hint.
3. Extremely zoomed-out overview may still hide labels; overlapping handled by truncate/shrink first.
