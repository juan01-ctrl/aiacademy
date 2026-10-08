# OpenAI API Fundamentals

**Level:** Basic  
**Time:** 3 hr. Three chapters, matching DataCamp's *Working with the OpenAI API* (3 hr, 3 chapters, 29 exercises). Theory steps are 4 minutes. Exercises are 6 minutes. The final project is 6 minutes.  
**Sources:** [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses), [Structured outputs](https://platform.openai.com/docs/guides/structured-outputs), [Function calling](https://platform.openai.com/docs/guides/function-calling). Compared with DataCamp's *Working with the OpenAI API*, which also starts at the request and only later reaches tools and conversations.

## What you can do at the end

You can write a Python function that calls the Responses API, reads `output_text`, passes `instructions` separately from `input`, offers a tool, asks for a named JSON schema, and survives a blank prompt or a raised error. You can explain why a sentence in the prompt is not the same thing as an API argument.

## Time model

A chapter time is the sum of its lessons. A lesson time is `4 × theory steps + 6 × exercises`. The course total adds 6 minutes for the final project.

## Chapters

### 0. What the API is — 16 min

DataCamp opens *Working with the OpenAI API* with "What is the OpenAI API?" and "Applications built on the OpenAI API" before the first request. This course does the same.

- What the API is. A function call, not ChatGPT.
- What it is for. Generated text, a tool request, or a schema.
- What this course will make you practice, in order.

### 1. Responses API — 42 min

The call, the object, and the arguments.

- A program calls `responses.create`. It does not open a chat window.
- `model` and `input` are arguments. Hard-coding the model means the caller cannot change it.
- `output` is the raw list. The text guide says it is not safe to assume the sentence is at `output[0]`. `output_text` is the convenience string.
- `instructions` takes priority over `input`. That pairing comes next in the same guide, before tools.

### 2. Structured outputs — 14 min

The text guide lists this as the next step after plain text.

- "Reply in JSON" inside the prompt is a wish. A schema on the request is a constraint.
- Pass the format as the `text` argument. Keep the schema name stable.

### 3. Sampling — 14 min

The same guide treats generation as non-deterministic before it sends you to later APIs.

- `temperature` near 0 asks for the more likely continuation.
- It is an argument of the request, not a sentence in `input`.

### 4. Tools — 18 min

Function calling is a separate, later guide. The model asks for a function. Your code runs it.

### 5. When the call fails — 32 min

Happy path first. Then the blank prompt, then a raised error.

## Deliberately out of scope

Streaming, file uploads, the Realtime API, and fine-tuning. Those are real, and they are not required to understand the request you will write most often.

## Final project

`ask_llm` returns `output_text` for a real prompt, returns `""` for a blank prompt without calling the API, and returns `""` if `create` raises.
