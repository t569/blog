import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const CloudSearch: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  if (fileData.slug !== "cloud-search") return <></>

  return (
    <div id="cloud-search-app">
      <div style={{ marginTop: "1.5rem" }}>
        <input type="text" id="cs-input" placeholder="Enter a concept (e.g., system architecture, ZKP)..." style={{ width: "100%", padding: "0.8rem", borderRadius: "6px", border: "1px solid var(--lightgray)", background: "var(--light)", color: "var(--dark)", fontSize: "1rem" }} />
        <button id="cs-btn" style={{ marginTop: "10px", padding: "0.6rem 1.2rem", borderRadius: "6px", cursor: "pointer", background: "var(--secondary)", color: "var(--light)", border: "none", fontWeight: "bold" }}>Semantic Search</button>
      </div>
      <div id="cs-loading" style={{ display: "none", marginTop: "1.5rem", fontStyle: "italic", color: "var(--gray)" }}>
        Searching the database and generating AI suggestions...
      </div>
      <div id="cs-results" style={{ marginTop: "1.5rem" }}></div>
    </div>
  )
}

CloudSearch.afterDOMLoaded = `
  const app = document.getElementById('cloud-search-app');
  if (app) {
    const input = document.getElementById('cs-input');
    const btn = document.getElementById('cs-btn');
    const loading = document.getElementById('cs-loading');
    const resultsDiv = document.getElementById('cs-results');

    async function performSearch(query) {
      if (!query) return;
      loading.style.display = 'block';
      resultsDiv.innerHTML = '';

      try {
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const PROD_API = "https://resource-api-eight.vercel.app";
        const LOCAL_API = "http://127.0.0.1:8000";

        let res;

        if (isLocalhost) {
          try {
            res = await fetch(LOCAL_API + '/search?q=' + encodeURIComponent(query) + '&top_k=5');
            if (!res.ok) throw new Error("Local API offline");
          } catch (e) {
            console.warn("Local backend offline. Falling back to Production API 🟢");
            res = await fetch(PROD_API + '/search?q=' + encodeURIComponent(query) + '&top_k=5');
          }
        } else {
          res = await fetch(PROD_API + '/search?q=' + encodeURIComponent(query) + '&top_k=5');
        }

        if (!res || !res.ok) throw new Error("Both APIs failed");
        
        const data = await res.json();
        let html = '';

        // 1. Render the Internal Semantic Matches
        if (data.results && data.results.length > 0) {
          data.results.forEach(item => {
            const tagsHtml = (item.tags || []).map(t => 
              '<span style="display:inline-block; background:var(--tertiary); color:var(--darkgray); padding:0.2rem 0.5rem; border-radius:4px; font-size:0.8rem; margin-right:0.4rem; margin-top:0.5rem;">#' + t + '</span>'
            ).join('');
            
            const safeUrl = item.url || '#';
            const safeTitle = item.title || 'Untitled Resource';
            const safeDesc = item.description || '';

            html += '<div style="border: 1px solid var(--lightgray); padding: 1.2rem; border-radius: 8px; margin-bottom: 1rem; background: var(--light);">' +
                '<h3 style="margin-top: 0; margin-bottom: 0.5rem;">' +
                  '<a href="' + safeUrl + '" target="_blank" rel="noopener" style="text-decoration: none; color: var(--secondary);">' + safeTitle + '</a>' +
                '</h3>' +
                '<p style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--dark);">' + safeDesc + '</p>' +
                '<div>' + tagsHtml + '</div>' +
              '</div>';
          });
        } else {
          html += '<p>No semantic matches found.</p>';
        }

        // 2. THE RESTORED GOOGLE SEARCH PIPELINE
        if (data.ai_suggested_queries && data.ai_suggested_queries.length > 0) {
          const pills = data.ai_suggested_queries.map(q => {
            const googleUrl = 'https://www.google.com/search?q=' + encodeURIComponent(q);
            return '<a href="' + googleUrl + '" target="_blank" rel="noopener" style="display:inline-block; background:var(--secondary); color:var(--light); padding:0.4rem 0.8rem; border-radius:20px; font-size:0.85rem; margin:0.3rem 0.3rem 0 0; text-decoration:none; transition: opacity 0.2s;">🔍 ' + q + '</a>';
          }).join('');

          html += '<div style="margin-top: 2rem; padding: 1.2rem; background: var(--highlight); border-radius: 8px; border-left: 4px solid var(--secondary);">' +
              '<strong style="color: var(--dark);">Generated Google Deep Dives:</strong><br/>' +
              '<p style="font-size: 0.85rem; color: var(--gray); margin-top: 0.2rem; margin-bottom: 0.8rem;">Click to explore these concepts further on the web.</p>' +
              '<div>' + pills + '</div>' +
            '</div>';
        }

        resultsDiv.innerHTML = html;

      } catch (err) {
        resultsDiv.innerHTML = '<p style="color:red; font-weight:bold;">Error connecting to the search API. Is your backend running?</p>';
      } finally {
        loading.style.display = 'none';
      }
    }

    btn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        performSearch(input.value); 
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { 
            e.preventDefault(); 
            performSearch(input.value); 
        }
    });
  }
`

export default (() => CloudSearch) satisfies QuartzComponentConstructor