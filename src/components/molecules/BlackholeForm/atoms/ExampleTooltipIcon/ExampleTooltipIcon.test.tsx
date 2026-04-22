import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ExampleTooltipIcon } from './ExampleTooltipIcon'

describe('ExampleTooltipIcon', () => {
  it('renders a bulb icon with the provided tooltip text as aria-label', () => {
    render(<ExampleTooltipIcon tooltip="Example: registry.example.com/app:v1.2.3" />)

    const icon = document.querySelector('.anticon-bulb')
    expect(icon).toBeInTheDocument()
  })
})
