import { useState } from "preact/hooks"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const ResourceExplorer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const API_URL = "https://resource-api-65nk.onrender.com"

  const handleSearch = async (e: Event) => {
    e.preventDefault()
    if (!query) return
    
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/resources/search?q=${encodeURIComponent(query)}&top_k=3`)
      const data = await response.json()
      setResults(data)
    } catch (err) {
      console.error("Search failed", err)
    }
    setLoading(false)
  }

  return (
    <div class={`resource-explorer ${displayClass ?? ""}`}>
      <h3>🌌 Search the Constellation</h3>
      <form onSubmit={handleSearch} class="explorer-form">
        <input 
          type="text" 
          placeholder="Query the Vector DB..." 
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Scanning..." : "Search"}
        </button>
      </form>

      {results.length > 0 && (
        <div class="explorer-results">
          {results.map(r => (
            <div class="result-card">
              <a href={r.url} target="_blank" rel="noreferrer" class="result-title">{r.title}</a>
              <div class="result-queries">
                {r.google_queries?.map((q: string) => (
                  <a href={`https://google.com/search?q=${q.replace(/ /g, '+')}`} target="_blank" rel="noreferrer">
                    🔍 {q}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

ResourceExplorer.css = `
.resource-explorer {
  display: flex;
  flex-direction: column;
  margin-top: 2rem;
}
.resource-explorer h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--dark);
}
.explorer-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}
.explorer-form input, .explorer-form button {
  box-sizing: border-box;
  width: 100%;
  font-family: inherit;
}
.explorer-form input {
  background-color: var(--light);
  border: 1px solid var(--lightgray);
  color: var(--dark);
  padding: 0.4rem 0.6rem;
  border-radius: 5px;
  font-size: 0.9rem;
}
.explorer-form input:focus {
  outline: none;
  border-color: var(--tertiary);
}
.explorer-form button {
  background-color: var(--lightgray);
  color: var(--dark);
  border: 1px solid var(--lightgray);
  border-radius: 5px;
  padding: 0.4rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.explorer-form button:hover:not(:disabled) {
  background-color: var(--tertiary);
  color: var(--light);
  border-color: var(--tertiary);
}
.result-card {
  margin-top: 1rem;
  padding-left: 0.5rem;
  border-left: 2px solid var(--tertiary);
}
.result-title {
  font-weight: 600;
  color: var(--dark);
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
  text-decoration: none;
  word-wrap: break-word;
}
.result-title:hover {
  color: var(--tertiary);
}
.result-queries {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.result-queries a {
  color: var(--secondary);
  font-size: 0.8rem;
  text-decoration: none;
  word-wrap: break-word;
}
.result-queries a:hover {
  color: var(--tertiary);
}
`

export default (() => ResourceExplorer) satisfies QuartzComponentConstructor