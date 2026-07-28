// Base URL of the Flask backend. Override by creating a `.env` file with
// VITE_API_BASE_URL=http://your-host:5000 if it's not running locally.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    throw new Error(
      'Could not reach the backend. Is the Flask server running on ' + API_BASE + '?'
    )
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.msg || data.error || `Request failed (${response.status})`)
  }

  return data
}

export const registerUser = (username, email, password) =>
  request('/register', { method: 'POST', body: { username, email, password } })

export const loginUser = (email, password) =>
  request('/login', { method: 'POST', body: { email, password } })

export const getSummary = (token, text, type) =>
  request('/get_summary', { method: 'POST', token, body: { text, type } })

export const getSummaryById = (token, meetId) =>
  request(`/get_summary_by_id/${meetId}`, { token })
