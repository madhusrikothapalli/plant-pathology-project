import { useEffect, useRef, useState } from 'react'
import './App.css'
import Header from './components/Header'
import Footer from  './components/Footer'
import 'bootstrap/dist/css/bootstrap.min.css'

const API_URL = import.meta.env.VITE_API_URL || ''

function App() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [result, setResult] = useState(null)
  const [health, setHealth] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline' }))

    fetch(`${API_URL}/api/predictions`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setHistory)
      .catch(() => setHistory([]))
  }, [])

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  function selectFile(selected) {
    if (!selected) return
    if (!selected.type.startsWith('image/')) {
      setError('Please choose a JPG, PNG, or WebP image.')
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('Choose an image that is 10 MB or smaller.')
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setResult(null)
    setError('')
  }

  async function predict() {
    if (!file) {
      setError('Choose a plant leaf image first.')
      return
    }
    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await fetch(`${API_URL}/api/predict`, { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Prediction failed.')
      setResult(data)
      setHistory((previous) => [data, ...previous].slice(0, 20))
    } catch (requestError) {
      setError(requestError.message === 'Failed to fetch'
        ? 'Cannot reach the API. Start the backend on port 3000 and try again.'
        : requestError.message)
    } finally {
      setLoading(false)
    }
  }

return (
  <>
    <Header />
    <main className="app-main">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">AI plant health assistant</span>
          <h1>Spot plant diseases before they spread.</h1>
          <p>Upload a clear leaf photo for an assessment from your connected plant disease model.</p>
          <div className="status-line">
            <span className={`status-dot ${health?.database === 'connected' && health?.model === 'configured' ? 'online' : ''}`} />
            {health?.status === 'offline'
              ? 'API offline'
              : health?.database === 'connected' && health?.model === 'configured'
                ? 'Database connected · disease model ready'
                : health
                  ? `Database ${health.database} · disease model ${health.model === 'configured' ? 'ready' : 'not configured'}`
                  : 'Connecting to API...'}
          </div>
        </div>

        <div className="detector-card" id="detector">
          {!preview ? (
            <button
              className="upload-zone"
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]) }}
            >
              <span className="upload-icon" aria-hidden="true">+</span>
              <strong>Upload a leaf image</strong>
              <span>Drag and drop, or click to browse</span>
              <small>JPG, PNG or WebP · Maximum 10 MB</small>
            </button>
          ) : (
            <div className="preview-panel">
              <img src={preview} alt="Selected plant leaf" />
              <button type="button" className="change-image" onClick={() => inputRef.current?.click()}>
                Change image
              </button>
            </div>
          )}
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => selectFile(event.target.files[0])}
          />
          {error && <div className="alert-message" role="alert">{error}</div>}
          <button className="predict-button" type="button" onClick={predict} disabled={loading || !file}>
            {loading ? <><span className="spinner" />Analyzing leaf...</> : 'Analyze leaf'}
          </button>

          {result && (
            <section className="result-panel" aria-live="polite">
              <div className="result-heading">
                <div>
                  <span>Assessment</span>
                  <h2>{result.name}</h2>
                </div>
                {result.confidence > 0 && <strong>{result.confidence}% confidence</strong>}
              </div>
              <div className="result-details">
                <div><span>Description</span><p>{result.description}</p></div>
                <div><span>Severity</span><p>{result.severity}</p></div>
                <div><span>Recommended action</span><p>{result.treatment}</p></div>
              </div>
              {result.alternatives?.length > 0 && (
                <div className="alternatives">
                  <span>Other possibilities</span>
                  {result.alternatives.map((item) => <small key={item.name}>{item.name} · {item.confidence}%</small>)}
                </div>
              )}
            </section>
          )}
        </div>
      </section>
      {history.length > 0 && (
        <section className="history-section" aria-label="Recent assessments">
          <h2>Recent assessments</h2>
          <ul>
            {history.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <small>{item.confidence}% confidence · {item.severity}</small>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>

    <Footer />
  </>
);   
}
export default App