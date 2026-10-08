CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    agents = [item for item in trace if item.get("name") == "Agent"]
    if not agents:
        return {"passed": False, "feedback": [{"concept": "ADK", "message": "Create an Agent."}]}
    arguments = agents[-1].get("arguments", {})
    if arguments.get("name") != "researcher" or arguments.get("tools") != 1:
        return {"passed": False, "feedback": [{"concept": "ADK", "message": "Name the agent researcher and pass google_search in tools."}]}
    if "research" not in arguments.get("instruction", "").lower():
        return {"passed": False, "feedback": [{"concept": "instruction", "message": "The instruction should say the agent helps users research."}]}
    return {"passed": True, "feedback": [{"concept": "ADK", "message": "The researcher has a model, an instruction, and a tool."}]}
