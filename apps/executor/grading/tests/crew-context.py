CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    tasks = [item for item in trace if item.get("name") == "Task"]
    writer = [item for item in tasks if item.get("arguments", {}).get("role") == "writer"]
    if not writer:
        return {"passed": False, "feedback": [{"concept": "Crew", "message": "Create a writer agent and assign the report task to that role."}]}
    arguments = writer[-1].get("arguments", {})
    if arguments.get("expected_output") != "A markdown report.":
        return {"passed": False, "feedback": [{"concept": "expected_output", "message": "Set expected_output to A markdown report."}]}
    if arguments.get("context") != 1:
        return {"passed": False, "feedback": [{"concept": "context", "message": "Pass the research task in context so the writer can read it."}]}
    return {"passed": True, "feedback": [{"concept": "Crew", "message": "The writer reads the research task and knows the report shape."}]}
