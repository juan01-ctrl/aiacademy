CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    pipelines = [item for item in trace if item.get("name") == "SequentialAgent"]
    if not pipelines or pipelines[-1].get("arguments", {}).get("name") != "pipeline":
        return {"passed": False, "feedback": [{"concept": "Sequence", "message": "Create a SequentialAgent named pipeline."}]}
    if pipelines[-1].get("arguments", {}).get("agents") != 2:
        return {"passed": False, "feedback": [{"concept": "Sequence", "message": "Pass the researcher and the writer, in that order."}]}
    return {"passed": True, "feedback": [{"concept": "Sequence", "message": "The writer runs after the researcher."}]}
