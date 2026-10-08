CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    roles = [item.get("arguments", {}).get("role") for item in trace if item.get("name") == "Agent"]
    tasks = [item for item in trace if item.get("name") == "Task"]
    if "researcher" not in roles or not tasks or tasks[-1].get("arguments", {}).get("description") != "Collect notes":
        return {"passed": False, "feedback": [{"concept": "Task", "message": "Create a researcher and assign a task described as Collect notes."}]}
    return {"passed": True, "feedback": [{"concept": "Task", "message": "The research task has an owner."}]}
