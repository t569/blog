import { useState } from "preact/hooks"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const ResourceSubmitter: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    // HIDDEN UNLESS ON ADMIN PAGE
    if(fileData.slug != "admin") {
        return null
    }

    const API_URL = "https://resource-api-65nk.onrender.com"
    const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    category: "",
    tags: ""
  })
  const [apiKey, setApiKey] = useState("")
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message: string }>({ type: "idle", message: "" })

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setStatus({ type: "loading", message: "Staging resource and generating deep-dive queries..." })

    // Convert comma-separated string to array
    const payload = {
      ...formData,
      tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag !== "")
    }

    try {
      const response = await fetch(`${API_URL}/resources/stage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Garden-Key": apiKey // The Vault Door
        },
        body: JSON.stringify(payload)
      })

      if (response.status === 403) {
        throw new Error("Access Denied: Invalid API Key.")
      }

      if (!response.ok) {
        throw new Error("Failed to stage resource.")
      }

      const data = await response.json()
      setStatus({ type: "success", message: `Success! PR created for review. Generated ${data.queries.length} queries.` })
      
      // Clear form on success
      setFormData({ title: "", url: "", description: "", category: "", tags: "" })
      
    } catch (err: any) {
      setStatus({ type: "error", message: err.message })
    }
  }

  return (
    <div class={`resource-submitter ${displayClass ?? ""}`}>
      <h3>Stage a New Resource</h3>
      <form onSubmit={handleSubmit} class="submitter-form">
        
        <input required type="text" placeholder="Resource Title" value={formData.title} 
          onChange={(e) => setFormData({...formData, title: (e.target as HTMLInputElement).value})} />
        
        <input required type="url" placeholder="URL (https://...)" value={formData.url} 
          onChange={(e) => setFormData({...formData, url: (e.target as HTMLInputElement).value})} />
        
        <textarea required placeholder="Brief description and why it matters..." value={formData.description} 
          onChange={(e) => setFormData({...formData, description: (e.target as HTMLTextAreaElement).value})} />
        
        <div class="input-row">
          <input required type="text" placeholder="Category (e.g., Architecture)" value={formData.category} 
            onChange={(e) => setFormData({...formData, category: (e.target as HTMLInputElement).value})} />
          <input type="text" placeholder="Tags (comma separated)" value={formData.tags} 
            onChange={(e) => setFormData({...formData, tags: (e.target as HTMLInputElement).value})} />
        </div>

        <div class="auth-row">
          <input required type="password" placeholder="X-Garden-Key" value={apiKey} 
            onChange={(e) => setApiKey((e.target as HTMLInputElement).value)} />
          <button type="submit" disabled={status.type === "loading"}>
            {status.type === "loading" ? "Processing..." : "Stage Resource"}
          </button>
        </div>

      </form>

      {/* Status Feedback */}
      {status.type !== "idle" && (
        <div class={`status-banner ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  )
}

// Quartz boilerplate to compile the component
ResourceSubmitter.css = `
.resource-submitter {
  display: flex;
  flex-direction: column;
  margin-top: 2rem;
}
.resource-submitter h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--dark);
}
.submitter-form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
}
.submitter-form input, .submitter-form textarea, .submitter-form button {
  box-sizing: border-box;
  width: 100%;
  font-family: inherit;
}
.submitter-form input, .submitter-form textarea {
  background-color: var(--light);
  border: 1px solid var(--lightgray);
  color: var(--dark);
  padding: 0.4rem 0.6rem;
  border-radius: 5px;
  font-size: 0.9rem;
}
.submitter-form input:focus, .submitter-form textarea:focus {
  outline: none;
  border-color: var(--tertiary);
}
.submitter-form textarea {
  min-height: 80px;
  resize: vertical;
}
.submitter-form button {
  background-color: var(--lightgray);
  color: var(--dark);
  border: 1px solid var(--lightgray);
  font-weight: 600;
  padding: 0.5rem;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  margin-top: 0.4rem;
}
.submitter-form button:hover:not(:disabled) { 
  background-color: var(--tertiary);
  color: var(--light);
  border-color: var(--tertiary);
}
.status-banner {
  box-sizing: border-box;
  width: 100%;
  margin-top: 1rem;
  padding: 0.6rem;
  border-radius: 5px;
  font-size: 0.85rem;
  word-wrap: break-word;
  background-color: var(--lightgray);
  color: var(--dark);
}
.status-banner.error { color: #cc0000; border-left: 3px solid #cc0000; }
.status-banner.success { color: #008800; border-left: 3px solid #008800; }
.status-banner.loading { color: var(--secondary); border-left: 3px solid var(--secondary); }

:root[saved-theme="dark"] .status-banner.error { color: #ff6b6b; border-color: #ff6b6b; }
:root[saved-theme="dark"] .status-banner.success { color: #51cf66; border-color: #51cf66; }
`

export default (() => ResourceSubmitter) satisfies QuartzComponentConstructor