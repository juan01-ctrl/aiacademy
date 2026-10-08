CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    if not result.get("ok"):
        return {
            "passed": False,
            "feedback": [{
                "concept": "Function shape",
                "message": result.get("error", "ask_with_model did not return a string."),
            }],
        }
    calls = [item for item in trace if item.get("name") == "responses.create"]
    if not calls or calls[-1].get("arguments", {}).get("model") != "gpt-4.1-mini":
        return {
            "passed": False,
            "feedback": [{
                "concept": "Model argument",
                "message": "Pass the model argument through to responses.create.",
            }],
        }
    if calls[-1].get("arguments", {}).get("input") != "ping":
        return {
            "passed": False,
            "feedback": [{
                "concept": "Input",
                "message": "Send the prompt as input.",
            }],
        }
    if result.get("value") != "mocked-output":
        return {
            "passed": False,
            "feedback": [{
                "concept": "output_text",
                "message": "Return response.output_text.",
            }],
        }
    return {
        "passed": True,
        "feedback": [{
            "concept": "Model argument",
            "message": "The model and prompt reached responses.create, and you returned the text.",
        }],
    }
