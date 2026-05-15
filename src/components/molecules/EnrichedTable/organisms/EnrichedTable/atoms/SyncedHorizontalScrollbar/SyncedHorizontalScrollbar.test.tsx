import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SyncedHorizontalScrollbar } from './SyncedHorizontalScrollbar'

type TElementSize = {
  clientWidth: number
  scrollWidth: number
}

type THarnessProps = TElementSize & {
  disabled?: boolean
}

const defineElementSize = (element: HTMLElement, { clientWidth, scrollWidth }: TElementSize) => {
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: clientWidth })
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: scrollWidth })
}

const Harness = ({ clientWidth, scrollWidth, disabled }: THarnessProps) => {
  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  return (
    <div ref={tableContainerRef}>
      <div
        className="ant-table-content"
        data-testid="table-scroller"
        ref={element => {
          if (element) {
            defineElementSize(element, { clientWidth, scrollWidth })
          }
        }}
      >
        <div />
      </div>
      <SyncedHorizontalScrollbar disabled={disabled} tableContainerRef={tableContainerRef} />
    </div>
  )
}

const ReplacingScrollerHarness = ({ clientWidth, scrollWidth }: TElementSize) => {
  const tableContainerRef = React.useRef<HTMLDivElement>(null)
  const [version, setVersion] = React.useState(0)

  return (
    <div ref={tableContainerRef}>
      <button
        data-testid="replace-scroller"
        type="button"
        onClick={() => setVersion(currentVersion => currentVersion + 1)}
      >
        replace
      </button>
      <div
        key={version}
        className="ant-table-content"
        data-testid="table-scroller"
        ref={element => {
          if (element) {
            defineElementSize(element, { clientWidth, scrollWidth })
          }
        }}
      >
        <div />
      </div>
      <SyncedHorizontalScrollbar tableContainerRef={tableContainerRef} />
    </div>
  )
}

describe('SyncedHorizontalScrollbar', () => {
  test('renders when the table has horizontal overflow', async () => {
    render(<Harness clientWidth={300} scrollWidth={900} />)

    const stickyScrollbar = await screen.findByTestId('enriched-table-horizontal-scrollbar')
    expect(stickyScrollbar).toBeInTheDocument()
    expect(stickyScrollbar.firstElementChild).toHaveStyle({
      width: '900px',
    })
  })

  test('does not render without horizontal overflow', () => {
    render(<Harness clientWidth={300} scrollWidth={300} />)

    expect(screen.queryByTestId('enriched-table-horizontal-scrollbar')).not.toBeInTheDocument()
  })

  test('does not render when disabled for virtual table fallback', () => {
    render(<Harness clientWidth={300} scrollWidth={900} disabled />)

    expect(screen.queryByTestId('enriched-table-horizontal-scrollbar')).not.toBeInTheDocument()
  })

  test('syncs scroll from the sticky scrollbar to the table scroller', async () => {
    render(<Harness clientWidth={300} scrollWidth={900} />)

    const tableScroller = screen.getByTestId('table-scroller')
    const stickyScrollbar = await screen.findByTestId('enriched-table-horizontal-scrollbar')

    stickyScrollbar.scrollLeft = 120
    fireEvent.scroll(stickyScrollbar)

    expect(tableScroller.scrollLeft).toBe(120)
  })

  test('syncs scroll from the table scroller to the sticky scrollbar', async () => {
    render(<Harness clientWidth={300} scrollWidth={900} />)

    const tableScroller = screen.getByTestId('table-scroller')
    const stickyScrollbar = await screen.findByTestId('enriched-table-horizontal-scrollbar')

    tableScroller.scrollLeft = 180
    fireEvent.scroll(tableScroller)

    expect(stickyScrollbar.scrollLeft).toBe(180)
  })

  test('rebinds listeners when antd replaces the table scroller node', async () => {
    render(<ReplacingScrollerHarness clientWidth={300} scrollWidth={900} />)

    const stickyScrollbar = await screen.findByTestId('enriched-table-horizontal-scrollbar')

    fireEvent.click(screen.getByTestId('replace-scroller'))

    const tableScroller = screen.getByTestId('table-scroller')
    tableScroller.scrollLeft = 240

    await waitFor(() => {
      fireEvent.scroll(tableScroller)
      expect(stickyScrollbar.scrollLeft).toBe(240)
    })
  })
})
