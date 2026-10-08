CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    if not result.get("ok"):
        return {
            "passed": False,
            "feedback": [{
                "concept": "Function shape",
                "message": result.get("error", "ask_llm did not return a string."),
            }],
        }
    calls = [item for item in trace if item.get("name") == "responses.create"]
    if not calls:
        return {
            "passed": False,
            "feedback": [{
                "concept": "Responses API",
                "message": "Call responses.create with the prompt before returning.",
            }],
        }
    if result.get("value") != "mocked-output":
        return {
            "passed": False,
            "feedback": [{
                "concept": "output_text",
                "message": "Return response.output_text. The raw output list is not the generated string.",
            }],
        }
    return {
        "passed": True,
        "feedback": [{
            "concept": "Responses API",
            "message": "You called responses.create and returned the generated text.",
        }],
    }
