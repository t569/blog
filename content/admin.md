---
title: "Vector Database Control Plane"
description: "Ingestion and staging dashboard for the RAG pipeline."
---

Welcome to the central ingestion hub. This interface interacts directly with the live Render FastAPI backend, executing the GitOps staging protocol before committing vectors to Pinecone.

> **Authorization Required:** > This portal is secured via header-based API keys. Unauthorized submissions will be rejected by the edge router.

---

### Ingestion Architecture
When a new architectural resource or piece of documentation is staged below, the system executes the following pipeline:
1. **Semantic Parsing:** The LLM analyzes the text and extracts core engineering concepts.
2. **Query Generation:** Three advanced Google search strings are dynamically synthesized for deep-dive exploration.
3. **GitOps Staging:** A Quartz-compatible markdown file is generated and pushed to a new branch on the GitHub repository via the `PyGithub` client.
4. **Pull Request Validation:** The submission waits in the repository as a PR. Once reviewed and merged, it is injected into the 1536-dimensional Pinecone index.

### Staging Terminal
Use the terminal below to submit new resources into the pending queue.

