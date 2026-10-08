# RAG Fundamentals

**Level:** Intermediate  
**Time:** 72 min. Theory steps are 4 minutes. Exercises are 6 minutes. The final project is 6 minutes.  
**Prerequisite:** you can call a model and return only the generated text.  
**Sources:** the retrieval-then-generation pattern used in LangChain RAG tutorials and DataCamp's retrieval courses. Embeddings are contrasted with keyword overlap so the learner does not treat a vector index as a search box with a new name.

## What you can do at the end

You can say what retrieval-augmented generation is for: the model does not know your document, so you fetch a passage and put that passage in the prompt. You can split a document into chunks, add those chunks to an index, search before you answer, and return the source of the hit instead of an uncited sentence. You can also name the two common failures: chunks that are too big to rank, and an answer written when search returned nothing.

## Chapters

### 0. What RAG is — 16 min

- What it is. Fetch a passage, then generate from it.
- What it is for. Facts that live in your files, with a source.
- Chunking starts only after that.

### 1. Chunk and index — 22 min

- Official retrieval order is load, split, embed, store, then retrieve. This chapter stops at store.
- An embedding is a list of numbers for a chunk. Similarity is not keyword overlap.
- `Index.add` is the teaching stand-in for that store step. You still split before you call it.

### 2. Retrieve and cite — 14 min

- Search happens before generation. You cannot cite a passage you did not fetch.
- A hit has `text` (the evidence) and `source` (the citation). Returning the whole list dumps the index into the caller.
- The exercise returns `hits[0]["source"]`. In a later system that source becomes a footnote. Here you only prove you kept it.

### 3. When retrieval fails — 14 min

- If search returns no hits, there is nothing to cite. Generating anyway is how a RAG app invents a source.
- `k` is how many hits you asked for. A larger `k` is not more truth. It is more context, and more chances to distract the model.
- The exercise must search, and if the hit list is empty it returns `""` instead of a made-up source.

## Deliberately out of scope

Rerankers, hybrid search, and evaluation harnesses such as RAGAS. You need a correct retrieve-then-cite loop before those tools mean anything.

## Final project

Split the document, index the chunks, search with the query, and return the source of the first hit.
