CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    if not any(item.get("name") == "search" for item in trace):
        return {"passed": False, "feedback": [{"concept": "Retrieval", "message": "Search before you decide there is no source."}]}
    if result.get("value") != "":
        return {"passed": False, "feedback": [{"concept": "Empty hits", "message": "When search returns nothing, return an empty string. Do not invent a source."}]}
    return {"passed": True, "feedback": [{"concept": "Empty hits", "message": "You searched, found nothing, and refused to invent a citation."}]}
