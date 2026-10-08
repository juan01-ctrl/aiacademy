CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    if not any(item.get("name") == "kickoff" for item in trace) or result.get("value") != "crew-result":
        return {"passed": False, "feedback": [{"concept": "Crew", "message": "Build the crew and return kickoff()."}]}
    return {"passed": True, "feedback": [{"concept": "Crew", "message": "The crew ran and you returned its result."}]}
