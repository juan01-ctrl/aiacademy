CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    if not result.get("ok"):
        return {
            "passed": False,
            "feedback": [{
                "concept": "Function shape",
                "message": result.get("error", "ask_with_instructions must return a string."),
            }],
        }
    calls = [item for item in trace if item.get("name") == "responses.create"]
    arguments = calls[-1].get("arguments", {}) if calls else {}
    if arguments.get("instructions") != "Answer in one word.":
        return {
            "passed": False,
            "feedback": [{
                "concept": "instructions",
                "message": "Pass the instructions argument through. Do not drop the standing rule.",
            }],
        }
    if arguments.get("input") != "ping":
        return {
            "passed": False,
            "feedback": [{
                "concept": "input",
                "message": "The prompt belongs in input, not in instructions.",
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
            "concept": "instructions",
            "message": "Instructions and input stayed separate, and you returned the text.",
        }],
    }
