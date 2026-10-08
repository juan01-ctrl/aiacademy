CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    adds = [item for item in trace if item.get("name") == "add"]
    if not adds or adds[-1].get("arguments", {}).get("count") != 2:
        return {"passed": False, "feedback": [{"concept": "Chunking", "message": "Split on blank lines and add both chunks."}]}
    return {"passed": True, "feedback": [{"concept": "Chunking", "message": "Two chunks were indexed."}]}
