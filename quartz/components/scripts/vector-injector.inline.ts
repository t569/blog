// quartz/components/scripts/vector-injector.inline.ts

// @ts-nocheck
// We disable TS checking here because we are deliberately monkey-patching global Window objects

if (!window._vectorGraphPatched) {
    window._vectorGraphPatched = true;
    window._pineconeUrlsById = {};

    // 1. ROUTER PROXY (Clicks Out)
    // Because spaNavigate might not be defined yet (since we are in the <head>), 
    // we use a property setter to safely hijack it the moment Quartz creates it.
    let originalSpaNavigate = window.spaNavigate;
    Object.defineProperty(window, 'spaNavigate', {
        get() { return originalSpaNavigate; },
        set(fn) {
            originalSpaNavigate = (url, isBack) => {
                try {
                    const targetUrl = new URL(url.toString(), window.location.toString());
                    const slug = targetUrl.pathname.replace(/^\/|\/$/g, '');
                    if (window._pineconeUrlsById && window._pineconeUrlsById[slug]) {
                        window.open(window._pineconeUrlsById[slug], '_blank');
                        return; // Halt local routing!
                    }
                } catch (e) { console.error("Vector SPA interceptor error", e); }
                return fn(url, isBack);
            };
        }
    });

    // 2. FETCH PROXY (Data In)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        
        // Trap the Quartz graph data request
        if (url.includes('static/contentIndex.json')) {
            try {
                const res = await originalFetch(...args);
                if (!res.ok) return res;
                const localData = await res.clone().json();

                const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
                const API_URL = isLocalhost ? "http://127.0.0.1:8000" : "https://resource-api-eight.vercel.app";
                
                const cloudRes = await originalFetch(`${API_URL}/graph/cluster`);
                
                if (cloudRes.ok) {
                    const cloudData = await cloudRes.json();
                    
                    // Map Pinecone resources into Quartz's expected format
                    cloudData.nodes.forEach((n: any) => {
                        if (n.group !== "tag") {
                            const displayTitle = n.name + " 🟢"; 
                            localData[n.id] = {
                                title: displayTitle,
                                tags: [],
                                links: []
                            };
                            window._pineconeUrlsById[n.id] = n.url;
                        }
                    });

                    // Assign tags to the nodes
                    cloudData.links.forEach((l: any) => {
                        const src = typeof l.source === 'object' ? l.source.id : l.source;
                        const tgt = typeof l.target === 'object' ? l.target.id : l.target;
                        
                        if (tgt.startsWith("tag-")) {
                            const tag = tgt.replace("tag-", "");
                            if (localData[src]) {
                                if (!localData[src].tags) localData[src].tags = [];
                                if (!localData[src].tags.includes(tag)) localData[src].tags.push(tag);
                            }
                        }
                    });

                    // GLOBAL DEPTH:1 BYPASS
                    // Scan the ENTIRE vault. If a local blog post shares a tag with a Pinecone resource,
                    // hardwire a direct physical link between them so they appear instantly in the sidebars.
                    Object.keys(localData).forEach(localSlug => {
                        const localNode = localData[localSlug];
                        
                        // Only calculate outgoing links from actual blog posts
                        if (window._pineconeUrlsById[localSlug]) return; 
                        
                        const localTags = localNode.tags || [];
                        if (localTags.length === 0) return;

                        cloudData.nodes.forEach((cNode: any) => {
                            if (cNode.group !== "tag") {
                                const cTags = localData[cNode.id]?.tags || [];
                                const sharesTag = localTags.some(t => cTags.includes(t));
                                
                                if (sharesTag) {
                                    if (!localNode.links) localNode.links = [];
                                    if (!localNode.links.includes(cNode.id)) {
                                        localNode.links.push(cNode.id);
                                    }
                                }
                            }
                        });
                    });
                }
                
                return new Response(JSON.stringify(localData), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (e) {
                console.error("Vector DB injection failed", e);
                return originalFetch(...args);
            }
        }
        return originalFetch(...args);
    };
}