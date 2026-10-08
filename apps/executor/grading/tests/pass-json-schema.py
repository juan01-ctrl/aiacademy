import json
CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    calls = [item for item in trace if item.get("name") == "responses.create"]
    expected = json.dumps({"format": {"type": "json_schema", "name": "answer"}}, sort_keys=True)
    if not calls or calls[-1].get("arguments", {}).get("text_format") != expected:
        return {"passed": False, "feedback": [{"concept": "Structured output", "message": "Pass text with a schema named answer."}]}
    if result.get("value") != "mocked-output":
        return {"passed": False, "feedback": [{"concept": "output_text", "message": "Return response.output_text."}]}
    return {"passed": True, "feedback": [{"concept": "Structured output", "message": "The supplied format reached the simulated request unchanged, and you returned the text. Schema validity was not tested."}]}
