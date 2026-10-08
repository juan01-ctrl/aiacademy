CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    agents = [item for item in trace if item.get("name") == "Agent"]
    names = [item.get("arguments", {}).get("name") for item in agents]
    if "Planner" not in names or "Writer" not in names or "Manager" not in names:
        return {"passed": False, "feedback": [{"concept": "Research team", "message": "Create Planner, Writer, and Manager."}]}
    manager = [item for item in agents if item.get("arguments", {}).get("name") == "Manager"]
    if not manager or manager[-1].get("arguments", {}).get("handoffs") != 2:
        return {"passed": False, "feedback": [{"concept": "Handoffs", "message": "The manager hands off to both specialists."}]}
    return {"passed": True, "feedback": [{"concept": "Research team", "message": "The manager can delegate planning and writing."}]}
