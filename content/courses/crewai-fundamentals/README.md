# CrewAI Fundamentals

**Level:** Advanced  
**Time:** 68 min. Theory steps are 4 minutes. Exercises are 6 minutes. The final project is 6 minutes.  
**Prerequisite:** you can call a model, and you know a graph can route work. A crew is a higher-level team, not a simpler idea.  
**Sources:** [CrewAI agents, tasks, and crews](https://docs.crewai.com/concepts/agents), including sequential process (tasks run in order, each output can feed the next) and hierarchical process (a manager delegates). Kickoff is the run, not the constructor.

## What you can do at the end

You can staff a small crew without pretending four agents are smarter than one clear task. You can create an agent with a role and a goal, assign a task to that agent, put both lists on a `Crew`, and return `kickoff()`. You can say why sequential is the default, and why hierarchical needs a manager rather than a longer backstory.

## Chapters

### 0. What CrewAI is — 16 min

- What it is. Roles, owned tasks, and a crew that runs them.
- What it is for. Work you can split into named roles, in an order you know.
- The quickstart order comes next. Agent, task, process, kickoff.

### 1. Roles and tasks — 18 min

- An agent is a role, a goal, and a backstory. The role is the name other tasks use. The goal is the outcome. The backstory changes tone. It does not replace the task description.
- A task has a description, an expected output, and an owning agent. A task with no agent cannot run.
- The exercise creates a `researcher` and a task described as `Collect notes`.

### 2. Who delegates — 14 min

- Hierarchical process adds a manager that assigns work. You must pass a manager model or a manager agent. A crew of peers does not become hierarchical because you wrote "manager" in a backstory.
- Use sequential when the order is known. Use hierarchical when the order depends on who is free to do the work.
- The quickstart passes `process=Process.sequential` when the crew is constructed, then calls `kickoff()`. Process is not a later idea.

### 3. Crews — 14 min

- A crew is the agent list plus the task list. Construction does not run anything.
- `kickoff()` starts the work and returns the result. Forgetting it is the usual bug. The objects exist, and nothing happened.

## Deliberately out of scope

Flows, custom tools, and production tracing. Those sit on top of a crew that already has an owner and a kickoff.

## Final project

Create the researcher, assign the task, build the crew, and return `kickoff()`.
