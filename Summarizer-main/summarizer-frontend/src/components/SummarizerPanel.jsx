import { useState } from 'react'
import { getSummary, getSummaryById } from '../api'

export default function SummarizerPanel({ token, email, onSignOut }) {
  const [text, setText] = useState('')
  const [type, setType] = useState('abstractive')
  const [summary, setSummary] = useState('')
  const [meetId, setMeetId] = useState(null)
  const [lookupId, setLookupId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  async function handleSummarize(e) {
    e.preventDefault()
    setError('')
    setSummary('')
    setLoading(true)
    try {
      const data = await getSummary(token, text, type)
      setSummary(data.summary)
      setMeetId(data.meet_id)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLookup(e) {
    e.preventDefault()
    setError('')
    if (!lookupId) return
    setLoading(true)
    try {
      const data = await getSummaryById(token, lookupId)
      setSummary(data.summary)
      setMeetId(lookupId)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="workspace">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Marginal</p>
          <h1 className="workspace-title">Lecture &amp; meeting notes</h1>
        </div>
        <div className="account-chip">
          <span>{email}</span>
          <button className="btn btn-ghost" onClick={onSignOut}>Sign out</button>
        </div>
      </header>

      <div className="workspace-grid">
        <section className="card page-card">
          <div className="card-tab">Paste your notes</div>
          <form onSubmit={handleSummarize} className="stack">
            <textarea
              className="notes-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the lecture transcript or meeting notes here…"
              rows={14}
              required
            />
            <div className="input-footer">
              <span className="word-count">{wordCount} words</span>

              <div className="type-toggle" role="radiogroup" aria-label="Summary type">
                <button
                  type="button"
                  className={type === 'abstractive' ? 'toggle-btn is-active' : 'toggle-btn'}
                  onClick={() => setType('abstractive')}
                >
                  Abstractive (T5)
                </button>
                <button
                  type="button"
                  className={type === 'extractive' ? 'toggle-btn is-active' : 'toggle-btn'}
                  onClick={() => setType('extractive')}
                >
                  Extractive
                </button>
              </div>
            </div>

            {error && <p className="message message-error">{error}</p>}

            <button type="submit" className="btn btn-primary" disabled={loading || !text.trim()}>
              {loading ? 'Summarizing…' : 'Summarize'}
            </button>
          </form>

          <form onSubmit={handleLookup} className="lookup-row">
            <input
              type="number"
              min="1"
              placeholder="Look up by meeting ID…"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
            />
            <button type="submit" className="btn btn-ghost" disabled={loading || !lookupId}>
              Fetch
            </button>
          </form>
        </section>

        <section className="card index-card" aria-live="polite">
          <div className="index-card-pin" aria-hidden="true" />
          <div className="card-tab card-tab-accent">
            {meetId ? `Meeting #${meetId}` : 'Summary'}
          </div>

          {loading && !summary ? (
            <p className="index-card-placeholder">Reading through your notes…</p>
          ) : summary ? (
            <p className="index-card-text">{summary}</p>
          ) : (
            <p className="index-card-placeholder">
              Your summary will appear here, highlighted like a margin note.
            </p>
          )}

          {summary && (
            <p className="index-card-footnote">
              Sent to {email} · {type === 'extractive' ? 'extractive' : 'T5-small abstractive'}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
