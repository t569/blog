import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const ResourceSubmitter: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    // HIDDEN UNLESS ON ADMIN PAGE
    if(fileData.slug !== "admin") {
        return null
    }

  return (
    <div class={`resource-submitter ${displayClass ?? ""}`}>
      <h3>Inject a New Resource</h3>
      <form id="resource-inject-form" class="submitter-form">
        
        <input required type="text" id="inject-title" placeholder="Resource Title" />
        <input required type="url" id="inject-url" placeholder="URL (https://...)" />
        <textarea required id="inject-desc" placeholder="Brief description and why it matters..."></textarea>
        
        <div class="input-row">
          <input required type="text" id="inject-category" placeholder="Category (e.g., Architecture)" />
          <input type="text" id="inject-tags" placeholder="Tags (comma separated)" />
        </div>

        <div class="auth-row">
          <input required type="password" id="inject-key" placeholder="X-Garden-Key" />
          <button type="submit" id="inject-btn">Inject to DB</button>
        </div>

      </form>

      {/* Status Feedback (Hidden by default) */}
      <div id="inject-status-banner" class="status-banner" style="display: none;"></div>
    </div>
  )
}

// THE FIX: This script runs purely in the user's browser after Quartz loads the HTML
ResourceSubmitter.afterDOMLoaded = `
  const form = document.getElementById('resource-inject-form');
  const banner = document.getElementById('inject-status-banner');
  const btn = document.getElementById('inject-btn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // 1. Grab values from the DOM
      const title = document.getElementById('inject-title').value;
      const url = document.getElementById('inject-url').value;
      const desc = document.getElementById('inject-desc').value;
      const category = document.getElementById('inject-category').value;
      const tagsStr = document.getElementById('inject-tags').value;
      const apiKey = document.getElementById('inject-key').value;

      const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t !== "");

      // 2. Set Loading UI
      banner.style.display = 'block';
      banner.className = 'status-banner loading';
      banner.innerText = 'Embedding and pushing to Pinecone...';
      btn.disabled = true;

      // 3. Dynamic Environment Check
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const API_URL = isLocalhost ? "http://127.0.0.1:8000" : "https://resource-api-eight.vercel.app";

      // 4. Fire the Request
      try {
        const res = await fetch(\`\${API_URL}/resources/inject\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Garden-Key': apiKey
          },
          body: JSON.stringify({ title, url, description: desc, category, tags })
        });

        if (res.status === 403) throw new Error("Access Denied: Invalid API Key.");
        if (!res.ok) throw new Error(\`Server error: \${res.status}\`);

        const data = await res.json();
        
        // 5. Set Success UI
        banner.className = 'status-banner success';
        banner.innerText = \`Success! Resource embedded. ID: \${data.id.substring(0,8)}...\`;
        form.reset();
      } catch (err) {
        // 6. Set Error UI
        banner.className = 'status-banner error';
        banner.innerText = err.message;
      } finally {
        btn.disabled = false;
      }
    });
  }
`

ResourceSubmitter.css = `
.resource-submitter { display: flex; flex-direction: column; margin-top: 2rem; }
.resource-submitter h3 { font-size: 1rem; font-weight: 600; margin: 0 0 1rem 0; color: var(--dark); }
.submitter-form { display: flex; flex-direction: column; gap: 0.6rem; width: 100%; }
.submitter-form input, .submitter-form textarea, .submitter-form button { box-sizing: border-box; width: 100%; font-family: inherit; }
.submitter-form input, .submitter-form textarea { background-color: var(--light); border: 1px solid var(--lightgray); color: var(--dark); padding: 0.4rem 0.6rem; border-radius: 5px; font-size: 0.9rem; }
.submitter-form input:focus, .submitter-form textarea:focus { outline: none; border-color: var(--tertiary); }
.submitter-form textarea { min-height: 80px; resize: vertical; }
.submitter-form button { background-color: var(--lightgray); color: var(--dark); border: 1px solid var(--lightgray); font-weight: 600; padding: 0.5rem; border-radius: 5px; cursor: pointer; transition: all 0.2s ease; font-size: 0.9rem; margin-top: 0.4rem; }
.submitter-form button:hover:not(:disabled) { background-color: var(--tertiary); color: var(--light); border-color: var(--tertiary); }
.status-banner { box-sizing: border-box; width: 100%; margin-top: 1rem; padding: 0.6rem; border-radius: 5px; font-size: 0.85rem; word-wrap: break-word; background-color: var(--lightgray); color: var(--dark); }
.status-banner.error { color: #cc0000; border-left: 3px solid #cc0000; background-color: #ffe6e6; }
.status-banner.success { color: #008800; border-left: 3px solid #008800; background-color: #e6ffe6; }
.status-banner.loading { color: var(--secondary); border-left: 3px solid var(--secondary); }
:root[saved-theme="dark"] .status-banner.error { color: #ff6b6b; border-color: #ff6b6b; background-color: rgba(255, 107, 107, 0.1); }
:root[saved-theme="dark"] .status-banner.success { color: #51cf66; border-color: #51cf66; background-color: rgba(81, 207, 102, 0.1); }
`

export default (() => ResourceSubmitter) satisfies QuartzComponentConstructor