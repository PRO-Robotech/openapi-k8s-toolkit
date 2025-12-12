import { pickSeriesId } from './helpers'

describe('pickSeriesId', () => {
  it('returns container when present', () => {
    const metric = {
      container: 'container-1',
      pod: 'pod-1',
      instance: 'instance-1',
      job: 'job-1',
      __name__: 'metric_name',
    }

    expect(pickSeriesId(metric, 0)).toBe('container-1')
  })

  it('falls back to pod when container is missing', () => {
    const metric = {
      pod: 'pod-1',
      instance: 'instance-1',
      job: 'job-1',
      __name__: 'metric_name',
    }

    expect(pickSeriesId(metric, 1)).toBe('pod-1')
  })

  it('falls back to instance when container and pod are missing', () => {
    const metric = {
      instance: 'instance-1',
      job: 'job-1',
      __name__: 'metric_name',
    }

    expect(pickSeriesId(metric, 2)).toBe('instance-1')
  })

  it('falls back to job when container, pod, and instance are missing', () => {
    const metric = {
      job: 'job-1',
      __name__: 'metric_name',
    }

    expect(pickSeriesId(metric, 3)).toBe('job-1')
  })

  it('falls back to __name__ when no other labels are present', () => {
    const metric = {
      __name__: 'http_requests_total',
    }

    expect(pickSeriesId(metric, 4)).toBe('http_requests_total')
  })

  it('falls back to series_<idx> when metric has no usable labels', () => {
    const metric = {}

    expect(pickSeriesId(metric, 5)).toBe('series_5')
  })

  it('falls back to series_<idx> when all candidate labels are empty strings', () => {
    const metric = {
      container: '',
      pod: '',
      instance: '',
      job: '',
      __name__: '',
    }

    expect(pickSeriesId(metric, 6)).toBe('series_6')
  })

  it('does not mutate the metric object', () => {
    const metric = {
      pod: 'pod-1',
    }

    const copy = { ...metric }
    pickSeriesId(metric, 0)

    expect(metric).toEqual(copy)
  })

  it('uses the provided index correctly', () => {
    expect(pickSeriesId({}, 0)).toBe('series_0')
    expect(pickSeriesId({}, 42)).toBe('series_42')
  })
})
