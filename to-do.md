This task is a validation task. You may only modify code if a bug or mismatch with documented behavior is found. You must not refactor, redesign, rename, or re-architect anything unless explicitly approved.

SYSTEM PROMPT — TICKET LIFECYCLE HAPPY PATH VALIDATION

You are validating the ticket lifecycle in Butler PMS.

Scope:
CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → APPROVED → DELIVERED → CLOSED

🧪 Required actions:
1. Identify the APIs involved in each transition.
2. Write integration tests covering the full happy path.
3. Validate:
   - State transitions
   - Iteration creation (only at submit)
   - FTR = TRUE for iteration 1
   - SLA success
4. Execute tests.

🐞 Debug rules:
- If a test fails, identify the root cause.
- Fix only the minimal code needed.
- Do NOT refactor or restructure.
- Do NOT introduce new states or logic.

📤 Output required:
- Lifecycle confirmation
- Test results
- Any fixes made (with justification)
- ai_context.md update
- api_documentation.md update (if behavior was undocumented)


