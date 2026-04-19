import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const AdminPanel: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  // Only render on the admin page
  if (fileData.slug !== "admin") return <></>

  return (
    <div id="admin-panel-app">
      <div style={{ marginTop: "1.5rem", background: "var(--light)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--lightgray)" }}>
        <input type="password" id="admin-key" placeholder="Admin API Key" style={{ width: "100%", marginBottom: "10px", padding: "0.8rem", borderRadius: "6px", border: "1px solid var(--lightgray)", background: "var(--light)", color: "var(--dark)" }} />
        <input type="text" id="res-title" placeholder="Resource Title" style={{ width: "100%", marginBottom: "10px", padding: "0.8rem", borderRadius: "6px", border: "1px solid var(--lightgray)", background: "var(--light)", color: "var(--dark)" }} />
        <input type="url" id="res-url" placeholder="https://..." style={{ width: "100%", marginBottom: "10px", padding: "0.8rem", borderRadius: "6px", border: "1px solid var(--lightgray)", background: "var(--light)", color: "var(--dark)" }} />
        <textarea id="res-desc" placeholder="Brief description..." rows={3} style={{ width: "100%", marginBottom: "10px", padding: "0.8rem", borderRadius: "6px", border: "1px solid var(--lightgray)", background: "var(--light)", color: "var(--dark)" }}></textarea>
        <input type="text" id="res-cat" placeholder="Category (e.g., Article, Tool, Video)" style={{ width: "100%", marginBottom: "10px", padding: "0.8rem", borderRadius: "6px", border: "1px solid var(--lightgray)", background: "var(--light)", color: "var(--dark)" }} />
        <input type="text" id="res-tags" placeholder="Tags (comma separated, e.g., k8s, backend)" style={{ width: "100%", marginBottom: "15px", padding: "0.8rem", borderRadius: "6px", border: "1px solid var(--lightgray)", background: "var(--light)", color: "var(--dark)" }} />
        <button id="inject-btn" style={{ width: "100%", padding: "0.8rem", borderRadius: "6px", cursor: "pointer", background: "var(--secondary)", color: "var(--light)", border: "none", fontWeight: "bold" }}>Inject to Database</button>
        <div id="admin-status" style={{ marginTop: "15px", fontWeight: "bold", textAlign: "center" }}></div>
      </div>
    </div>
  )
}

AdminPanel.afterDOMLoaded = `
  const app = document.getElementById('admin-panel-app');
  if (app) {
    const injectBtn = document.getElementById('inject-btn');
    if (injectBtn) {
      injectBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // STOP Quartz from intercepting the click

        const statusDiv = document.getElementById('admin-status');
        statusDiv.style.color = "var(--gray)";
        statusDiv.innerText = "Injecting resource via ontology middleware...";

        const apiKey = document.getElementById('admin-key').value;
        const title = document.getElementById('res-title').value;
        const url = document.getElementById('res-url').value;
        const desc = document.getElementById('res-desc').value;
        const category = document.getElementById('res-cat').value;
        const tagsRaw = document.getElementById('res-tags').value;

        if (!apiKey || !title || !url || !category) {
          statusDiv.style.color = "red";
          statusDiv.innerText = "Error: Please fill out all required fields.";
          return;
        }

        const tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t);
        const payload = { title, url, description: desc, category, tags };

        try {
          const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          const PROD_API = "https://resource-api-eight.vercel.app";
          const LOCAL_API = "http://127.0.0.1:8000";

          const fetchOptions = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Garden-Key": apiKey
            },
            body: JSON.stringify(payload)
          };

          let res;

          // THE FIX: Intelligent Routing with Fallback
          if (isLocalhost) {
            try {
              res = await fetch(LOCAL_API + '/resources/inject', fetchOptions);
              if (!res.ok) throw new Error("Local API offline");
            } catch (err) {
              console.warn("Local backend offline. Rerouting injection to Production API 🟢");
              res = await fetch(PROD_API + '/resources/inject', fetchOptions);
            }
          } else {
            res = await fetch(PROD_API + '/resources/inject', fetchOptions);
          }

          if (!res || !res.ok) {
            // Attempt to grab the exact error message from FastAPI if it was rejected
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Server returned " + (res ? res.status : "an unknown error"));
          }
          
          statusDiv.style.color = "green";
          statusDiv.innerText = "✅ Resource successfully injected to Pinecone!";
          
          // Clear form on success
          document.getElementById('res-title').value = '';
          document.getElementById('res-url').value = '';
          document.getElementById('res-desc').value = '';
          document.getElementById('res-tags').value = '';
          
        } catch (err) {
          statusDiv.style.color = "red";
          statusDiv.innerText = "Error: " + err.message + ".";
        }
      });
    }
  }
`

export default (() => AdminPanel) satisfies QuartzComponentConstructor