'use client'

import { useState } from 'react'
import { getScrapeData } from './actions'
import { ScrapedData } from '@/types'

export default function DashboardClientPage() {
  const [url, setUrl] = useState('https://www.thecaverns.com/shows')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ScrapedData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) {
      setError('Please enter a URL.')
      return
    }
    setLoading(true)
    setData(null)
    setError(null)
    const result = await getScrapeData(url)
    if ('error' in result) {
      setError(result.error)
    } else {
      setData(result)
    }
    setLoading(false)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="input-group">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="form-control"
            placeholder="Enter URL to scrape"
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Scraping...' : 'Scrape'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {data && (
        <div className="card">
          <div className="card-header">
            Scraped Content from <a href={data.url} target="_blank" rel="noopener noreferrer">{data.url}</a>
          </div>
          <div className="card-body">
            <h5 className="card-title">{data.metadata?.title || 'No Title'}</h5>
            <p className="card-text">{data.metadata?.description || 'No Description'}</p>

            {data.json && data.json.events && data.json.events.length > 0 ? (
              <div>
                <h6>Extracted Events:</h6>
                <ul className="list-group">
                  {data.json.events.map((event, index) => (
                    <li key={index} className="list-group-item">
                      <strong>{event.title}</strong><br />
                      <small>Date: {event.date}</small><br />
                      {event.url && <a href={event.url} target="_blank" rel="noopener noreferrer">View Event</a>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <pre className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto' }}>
                {data.markdown}
              </pre>
            )}
          </div>
           <div className="card-footer text-muted">
            Scraped at: {new Date(data.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </>
  )
} 