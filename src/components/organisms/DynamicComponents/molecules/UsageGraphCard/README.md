# UsageGraphCard

## Overview
`UsageGraphCard` renders a small time-series chart plus a gradient usage bar with markers for
requested, used, and limit values. It can be driven by explicit `series`/`requested`/`used`/`limit`
props or by Prometheus queries (range + vector).

## Data flow
- URL and multi-query values are used to template Prometheus inputs via `parsePromTemplate`.
- The range query (`usePromMatrixToLineSingle`) provides the chart series when `series` is not set.
- Vector queries (`usePromVector`) provide `requested`, `used`, and `limit` when those props are not set.
- If a vector response is successful, all returned sample values are summed into a single number.

## Series selection
- If `series` is provided, it is used directly.
- Else, if a Prometheus `query` is provided, the fetched matrix series is used.
- Otherwise the component falls back to `DEFAULT_SERIES`.

## Percent + gradient logic
- Percentages are computed against `limit` with `clampPercent` to keep values in [0, 100].
- The gradient bar uses `requestedPercent` as its mid-stop, so the color transition matches the requested value.
- Marker and label rendering is conditional on the resolved values being defined.

## Layout clamping
Badges and labels are positioned by percentage, then clamped to avoid overflow:
- The "used" badge is centered on its marker but clamped inside the bar width.
- The "requested" label is clamped so it never overlaps or passes the "limit" label.
`ResizeObserver` updates the clamped positions when the container or labels change size.

## Notes
- `valueStrategy`, `valuePrecision`, and `hideUnit` control formatting via `FormattedValue`.
- The chart uses a padded Y domain based on the current series values.
