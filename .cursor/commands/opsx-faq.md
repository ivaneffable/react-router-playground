---
name: /opsx-faq
id: opsx-faq
category: Workflow
description: Append the last asked question and its answer to the change's faq.md (Experimental)
---

Append the **last asked question** (only the most recent one) and the answer you gave to `openspec/changes/<name>/faq.md` for the given change.

**Input**: Optionally specify a change name after `/opsx:faq` (e.g. `/opsx:faq add-google-auth`). If omitted, infer from conversation context or list available changes and let the user choose.

**Steps**

1. **Resolve the change name**
   - If provided (e.g. `/opsx:faq add-google-auth`), use it.
   - If omitted, infer from recent conversation (e.g. we've been working on add-google-auth) or run `openspec list --json` and show the top changes so the user can pick one. Do not guess a change name if ambiguous.

2. **Identify the last asked question and its answer**
   - **Last asked question**: The most recent user message in this conversation that is a question (something the user asked to understand or clarify). Ignore commands or non-questions. If the user just sent `/opsx:faq` with no prior question in this turn, use the immediately preceding user message if it was a question; otherwise ask the user to provide the question to store.
   - **Answer**: The answer you (the assistant) gave to that question — the assistant message that directly responded to that question. Summarize or copy the core of that answer so the FAQ entry is self-contained.

3. **Target file**
   - Path: `openspec/changes/<change-name>/faq.md`
   - If the file does not exist, create it with a minimal header and then the new Q&A (e.g. `# FAQ: <change-name>\n\n## …\n\n### <question>\n\n<answer>`).

4. **Append the Q&A**
   - Append to the end of `faq.md` in this format:
     - A level-3 heading with the question: `### <exact or succinct question>`
     - A blank line, then the answer (one or more paragraphs).
     - Optionally a horizontal rule `---` before the new entry for separation.
   - Preserve existing content. Do not remove or rewrite other Q&As. Only append this single new entry (the last asked question only).

5. **Confirm**
   - Tell the user what was appended and to which file (e.g. "Appended Q&A to openspec/changes/add-google-auth/faq.md").

**Guardrails**
- Store only **one** question per invocation — the last asked question.
- If you cannot identify a clear "last question" (e.g. no prior user question in the conversation), ask the user to type the question they want to save, then append that and the answer you would give (or the answer you just gave in this turn if they re-ask it).
- Use the change name as given or chosen; ensure the path is `openspec/changes/<name>/faq.md` (no trailing slash, exact name).
