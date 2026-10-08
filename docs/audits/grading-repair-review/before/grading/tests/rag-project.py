CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    names = [item.get("name") for item in trace]
    if "add" not in names or "search" not in names or result.get("value") != "notes.md":
        return {"passed": False, "feedback": [{"concept": "RAG", "message": "Index the chunks, search, and return the source."}]}
    return {"passed": True, "feedback": [{"concept": "RAG", "message": "The document was indexed and the citation came from retrieval."}]}
