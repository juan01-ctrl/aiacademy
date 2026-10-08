CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    if not any(item.get("name") == "search" for item in trace) or result.get("value") != "notes.md":
        return {"passed": False, "feedback": [{"concept": "Citation", "message": "Search, then return the source of the first hit."}]}
    return {"passed": True, "feedback": [{"concept": "Citation", "message": "The answer cites notes.md."}]}
