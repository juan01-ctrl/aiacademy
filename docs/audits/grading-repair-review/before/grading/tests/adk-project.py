CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    agents = [item for item in trace if item.get("name") == "Agent"]
    if not agents or agents[-1].get("arguments", {}).get("name") != "researcher":
        return {"passed": False, "feedback": [{"concept": "ADK", "message": "Build the researcher agent with google_search."}]}
    if agents[-1].get("arguments", {}).get("tools") != 1:
        return {"passed": False, "feedback": [{"concept": "Tools", "message": "Pass google_search in tools."}]}
    return {"passed": True, "feedback": [{"concept": "ADK", "message": "The researcher is ready to run."}]}
