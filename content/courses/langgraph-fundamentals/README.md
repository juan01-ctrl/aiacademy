# LangGraph Fundamentals

**Level:** Intermediate  
**Time:** 68 min. Theory steps are 4 minutes. Exercises are 6 minutes. The final project is 6 minutes.  
**Prerequisite:** you can call a model and read `output_text`.  
**Sources:** [LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api), [checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers), [interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts). The progression matches the official order: state, nodes, edges, then durability.

## What you can do at the end

You can explain why an agent loop is a graph and not a `while` wrapped around one prompt. You can define state, register a node, set an entry point, add a fixed edge, add a conditional edge, compile, and say why a checkpointer is required before a run can pause and resume.

## Chapters

### 0. What LangGraph is — 16 min

- What it is. Steps that share state.
- What it is for. Work with a next step, or a pause you must resume.
- The official build order comes after this. State, nodes, edges, compile.

### 1. State and nodes — 18 min

- State is the shared object. Nodes return updates. They do not own a private copy of the conversation.
- `StateGraph` records the state type. `add_node` binds a name to a function. `set_entry_point` chooses the first node. `compile` checks the graph and is required before you can run it.
- A node that returns a new dict is proposing an update. Reducers decide how that update merges. This course uses a plain dict so the merge stays visible.

### 2. Routing — 14 min

- `add_edge(source, target)` is a fixed hop. Use it when the next node never changes.
- `add_conditional_edges` takes a router and a map. The router reads state and returns a key. The map must contain that key.
- `approve` and `revise` are the route names in the exercise. A router that returns a key missing from the map is a broken graph, not a creative one.

### 3. Memory and pause — 14 min

- Without a checkpointer, each invoke starts from the input you just passed. There is no thread to resume.
- `compile(checkpointer=...)` is where durability is attached. A `thread_id` selects which run you are continuing.
- `interrupt()` inside a node pauses the run and returns a value to the caller. Resume continues from that point. Interrupt without a checkpointer cannot work, because there is nowhere to store the pause.

## Deliberately out of scope

The prebuilt ReAct agent, Store (long-term memory across threads), and deployment. Learn the graph API first. The prebuilt agent hides the nodes you just learned to name.

## Final project

A compiled graph whose entry node is `draft`, with an edge from `draft` to `review`.
