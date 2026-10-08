CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    calls = [item for item in trace if item.get("name") == "responses.create"]
    if not calls or calls[-1].get("arguments", {}).get("schema_name") != "answer":
        return {"passed": False, "feedback": [{"concept": "Structured output", "message": "Pass text with a schema named answer."}]}
    if result.get("value") != "mocked-output":
        return {"passed": False, "feedback": [{"concept": "output_text", "message": "Return response.output_text."}]}
    return {"passed": True, "feedback": [{"concept": "Structured output", "message": "The schema reached the request, and you returned the text."}]}
