SYSTEM PROMPT — ITERATION & FTR LOGIC VALIDATION

Validate revision behavior for Butler PMS.

Scope:
SUBMITTED → REVISION_REQUIRED → IN_PROGRESS → SUBMITTED → APPROVED

🧪 Required checks:
1. Ensure:
   - Iteration 1 is created on first submit
   - New iteration is created ONLY on REVISION_REQUIRED
   - Iteration count increments correctly
2. Validate:
   - FTR becomes permanently FALSE after first rejection
   - Approval on later iterations does not change FTR
3. Execute tests for:
   - Multiple revisions
   - Max iteration threshold (if configured)

🐞 Debug rules:
- Fix only incorrect counters, flags, or triggers.
- Do NOT reset iterations.
- Do NOT change analytics formulas.

📤 Output required:
- Iteration behavior confirmation
- FTR logic confirmation
- Test output
- ai_context.md update if clarifications were needed
