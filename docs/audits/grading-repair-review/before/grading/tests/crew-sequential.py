CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    crews = [item for item in trace if item.get("name") == "Crew"]
    if not crews or crews[-1].get("arguments", {}).get("process") != "sequential":
        return {"passed": False, "feedback": [{"concept": "Process", "message": "Pass process='sequential'. A backstory does not choose the process."}]}
    if result.get("value") != "crew-result":
        return {"passed": False, "feedback": [{"concept": "Crew", "message": "Return kickoff()."}]}
    return {"passed": True, "feedback": [{"concept": "Process", "message": "The crew is sequential, and you returned the kickoff result."}]}
