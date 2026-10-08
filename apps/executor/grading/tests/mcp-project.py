CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    if not any(item.get("name") == "FastMCP" and item.get("arguments", {}).get("name") == "weather" for item in trace):
        return {"passed": False, "feedback": [{"concept": "MCP", "message": "Expose a weather server."}]}
    if not any(item.get("name") == "mcp.tool" and item.get("arguments", {}).get("name") == "get_weather" for item in trace):
        return {"passed": False, "feedback": [{"concept": "MCP tool", "message": "Register get_weather on that server."}]}
    return {"passed": True, "feedback": [{"concept": "MCP", "message": "The weather tool is on the server."}]}
