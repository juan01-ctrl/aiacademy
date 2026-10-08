CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    drafts = [item for item in trace if item.get("name") == "draft"]
    judges = [item for item in trace if item.get("name") == "judge"]
    if not drafts or drafts[-1].get("arguments", {}).get("text") != "What is RAG":
        return {"passed": False, "feedback": [{"concept": "Chaining", "message": "Pass the original prompt to draft first."}]}
    if not judges or not str(judges[-1].get("arguments", {}).get("text", "")).endswith(" draft"):
        return {"passed": False, "feedback": [{"concept": "Chaining", "message": "Pass the draft output into judge. Do not send the original prompt twice."}]}
    if result.get("value") != "accepted":
        return {"passed": False, "feedback": [{"concept": "Chaining", "message": "Return what judge returns."}]}
    return {"passed": True, "feedback": [{"concept": "Chaining", "message": "The second call received the first call's output."}]}
