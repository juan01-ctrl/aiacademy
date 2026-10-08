CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    if not any(item.get("name") == "llm" for item in trace) or not any(item.get("name") == "run_tool" for item in trace):
        return {"passed": False, "feedback": [{"concept": "Agent", "message": "Call llm, run the tool it asks for, then call llm again."}]}
    if result.get("value") != "booked":
        return {"passed": False, "feedback": [{"concept": "Agent", "message": "Return the text from the turn where tool is done."}]}
    return {"passed": True, "feedback": [{"concept": "Agent", "message": "The loop achieved the goal."}]}
