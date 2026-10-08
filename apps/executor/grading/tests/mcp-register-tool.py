CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    servers = [item for item in trace if item.get("name") == "FastMCP"]
    tools = [item for item in trace if item.get("name") == "mcp.tool"]
    if not servers or servers[-1].get("arguments", {}).get("name") != "weather":
        return {"passed": False, "feedback": [{"concept": "MCP server", "message": "Create a FastMCP server named weather."}]}
    if not tools or tools[-1].get("arguments", {}).get("name") != "get_weather":
        return {"passed": False, "feedback": [{"concept": "MCP tool", "message": "Register get_weather with mcp.tool()."}]}
    return {"passed": True, "feedback": [{"concept": "MCP", "message": "The server exposes get_weather."}]}
