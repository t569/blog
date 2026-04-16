---
title: "Architecting a GitOps Vector Database for my Digital Garden"
date: 2026-04-16
tags: [systems-engineering, rts, pinecone, fastapi, preact]
description: "How I decoupled my backend, built a human-in-the-loop ingestion pipeline, and turned my blog into a live RAG application."
---

I don't just want a blog. I want a living system. 

Over the last few weeks, I realized that storing static links to obscure compiler documentation, bare-metal OS tutorials, and arXiv papers wasn't enough. I needed a way to query them semantically. So, I built a custom **Retrieval-Augmented Generation (RAG) pipeline** directly into this site.

### The Architecture
To keep the static speed of Quartz while gaining the power of a live database, I built a decoupled architecture:
1. **The Vector Backend:** A [FastAPI container hosted on Render](https://github.com/t569/resource-api) running OpenAI's `text-embedding-3-small` models and a Pinecone vector index.
2. **The Staging Pipeline:** An LLM reads the resource, generates deep-dive Google queries, and autonomously opens a Pull Request on my GitHub repo.
3. **The Static Frontend:** A custom Preact island that queries the live API and renders the results.

### Try It Out
Look at the right sidebar. You will see a widget titled **"Search the Constellation."** That isn't a standard text search—it is a live semantic search hitting my Pinecone vector database. Try searching for concepts like *"low level C programming"* or *"zero-knowledge proofs"*.

If you want to see the literal control panel where I manually stage and ingest these resources into the system, you can view the [[admin|Control Plane]]. (You won't be able to submit anything without my API key, but you can see the UI architecture).

Building systems that bridge static sites, serverless APIs, and vector math is exactly where engineering gets fun.