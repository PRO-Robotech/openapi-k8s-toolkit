import React from 'react'
import { render, screen } from '@testing-library/react'
import { AxiosError } from 'axios'
import { PerRequestError } from './PerRequestError'

describe('PerRequestError', () => {
  test('renders null when error is null', () => {
    const { container } = render(<PerRequestError error={null} />)
    expect(container.innerHTML).toBe('')
  })

  test('renders error message when error is an Error object', () => {
    render(<PerRequestError error={new Error('Something broke')} />)
    expect(screen.getByText('Something broke')).toBeInTheDocument()
    expect(screen.getByText('Errors:')).toBeInTheDocument()
  })

  test('renders error string when error is a string', () => {
    render(<PerRequestError error="Network timeout" />)
    expect(screen.getByText('Network timeout')).toBeInTheDocument()
    expect(screen.getByText('Errors:')).toBeInTheDocument()
  })

  test('renders AxiosError message', () => {
    const axiosError = new AxiosError('Request failed with status 500')
    render(<PerRequestError error={axiosError} />)
    expect(screen.getByText('Request failed with status 500')).toBeInTheDocument()
  })
})
