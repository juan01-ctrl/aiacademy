CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    names = [item.get("name") for item in trace]
    if "Agent" not in names or "Task" not in names or "kickoff" not in names:
        return {"passed": False, "feedback": [{"concept": "Crew", "message": "Create the agent, assign the task, and kick off the crew."}]}
    return {"passed": True, "feedback": [{"concept": "Crew", "message": "Research was assigned and the crew ran."}]}
