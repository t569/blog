import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const ResourceExplorer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <div class={`resource-explorer ${displayClass ?? ""}`}>
      <h3>🌌 Search the Constellation</h3>
      
      <form id="explorer-search-form" class="explorer-form">
        <input type="text" id="explorer-query" placeholder="e.g. Rust sandbox architecture..." />
        <button type="submit" id="explorer-btn">Search</button>
      </form>

      <div id="explorer-error" class="explorer-error" style="display: none;"></div>

      <div id="ai-suggestions-container" class="ai-suggestions" style="display: none;">
        <span class="ai-title">✨ Deep Dive Suggestions:</span>
        <div id="ai-suggestion-tags" class="suggestion-tags"></div>
      </div>

      <div id="explorer-results-container" class="explorer-results"></div>
    </div>
  )
}

// THE FIX: Moving the search logic into the client-side lifecycle
ResourceExplorer.afterDOMLoaded = `
  const form = document.getElementById('explorer-search-form');
  const queryInput = document.getElementById('explorer-query');
  const btn = document.getElementById('explorer-btn');
  const errorBox = document.getElementById('explorer-error');
  const aiContainer = document.getElementById('ai-suggestions-container');
  const aiTags = document.getElementById('ai-suggestion-tags');
  const resultsContainer = document.getElementById('explorer-results-container');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const query = queryInput.value.trim();
      if (!query) return;

      errorBox.style.display = 'none';
      aiContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
      btn.innerText = 'Scanning Vector DB...';
      btn.disabled = true;

      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const API_URL = isLocalhost ? "http://127.0.0.1:8000" : "https://resource-api-eight.vercel.app";

      try {
        const res = await fetch(\`\${API_URL}/search?q=\${encodeURIComponent(query)}&top_k=5\`);
        if (!res.ok) throw new Error(\`Database connection failed (\${res.status})\`);

        const data = await res.json();

        // --- THE GOOGLE SEARCH REDIRECTS ---
        if (data.ai_suggested_queries && data.ai_suggested_queries.length > 0) {
            aiTags.innerHTML = '';
            data.ai_suggested_queries.forEach(q => {
                const tagBtn = document.createElement('button');
                tagBtn.className = 'suggestion-tag';
                tagBtn.innerText = "🔍 " + q; // Added an icon to indicate leaving the site
                tagBtn.onclick = () => {
                    // Instantly redirect to Google Search in a new tab
                    window.open('https://www.google.com/search?q=' + encodeURIComponent(q), '_blank');
                };
                aiTags.appendChild(tagBtn);
            });
            aiContainer.style.display = 'block';
        }

        // Populate Pinecone Results
        if (data.results && data.results.length > 0) {
            data.results.forEach(r => {
                const card = document.createElement('div');
                card.className = 'result-card';

                const title = document.createElement('a');
                title.href = r.url;
                title.target = '_blank';
                title.className = 'result-title';
                title.innerText = r.title;

                const desc = document.createElement('p');
                desc.className = 'result-desc';
                desc.innerText = r.description;

                const tagContainer = document.createElement('div');
                tagContainer.className = 'result-tags';
                if (r.tags) {
                    r.tags.forEach(tagText => {
                        const span = document.createElement('span');
                        span.className = 'tag';
                        span.innerText = '#' + tagText;
                        tagContainer.appendChild(span);
                    });
                }

                card.appendChild(title);
                card.appendChild(desc);
                card.appendChild(tagContainer);
                resultsContainer.appendChild(card);
            });
        } else {
            errorBox.innerText = "No relevant resources found.";
            errorBox.style.display = 'block';
        }

      } catch (err) {
        errorBox.innerText = err.message || "Failed to reach the digital garden.";
        errorBox.style.display = 'block';
      } finally {
        btn.innerText = 'Search';
        btn.disabled = false;
      }
    });
  }
`

ResourceExplorer.css = `
.resource-explorer { display: flex; flex-direction: column; margin-top: 2rem; }
.resource-explorer h3 { font-size: 1rem; font-weight: 600; margin: 0 0 1rem 0; color: var(--dark); }
.explorer-form { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; }
.explorer-form input, .explorer-form button { box-sizing: border-box; width: 100%; font-family: inherit; }
.explorer-form input { background-color: var(--light); border: 1px solid var(--lightgray); color: var(--dark); padding: 0.4rem 0.6rem; border-radius: 5px; font-size: 0.9rem; }
.explorer-form input:focus { outline: none; border-color: var(--tertiary); }
.explorer-form button { background-color: var(--lightgray); color: var(--dark); border: 1px solid var(--lightgray); border-radius: 5px; padding: 0.4rem; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s ease; }
.explorer-form button:hover:not(:disabled) { background-color: var(--tertiary); color: var(--light); border-color: var(--tertiary); }
.explorer-error { color: #cc0000; font-size: 0.85rem; margin-top: 0.5rem; padding: 0.5rem; background-color: #ffe6e6; border-radius: 5px; }
.ai-suggestions { margin-top: 1rem; padding: 0.8rem; background-color: var(--light); border-radius: 8px; border: 1px dashed var(--tertiary); }
.ai-title { font-size: 0.8rem; font-weight: bold; color: var(--tertiary); display: block; margin-bottom: 0.5rem; }
.suggestion-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.suggestion-tag { background: transparent; border: 1px solid var(--secondary); color: var(--secondary); font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.suggestion-tag:hover { background: var(--secondary); color: var(--light); }
.result-card { margin-top: 1.5rem; padding-left: 0.8rem; border-left: 3px solid var(--tertiary); }
.result-title { font-weight: 600; color: var(--dark); display: block; font-size: 1rem; margin-bottom: 0.2rem; text-decoration: none; }
.result-title:hover { color: var(--tertiary); }
.result-desc { font-size: 0.85rem; margin: 0.3rem 0; color: var(--gray); }
.result-tags { display: flex; gap: 0.4rem; margin-top: 0.4rem; }
.result-tags .tag { font-size: 0.7rem; color: var(--secondary); background-color: var(--lightgray); padding: 0.1rem 0.4rem; border-radius: 4px; }
`

export default (() => ResourceExplorer) satisfies QuartzComponentConstructor