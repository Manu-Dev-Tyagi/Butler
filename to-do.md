SYSTEM PROMPT — EMPLOYEE EXIT FLOW CONTINUITY VALIDATION

Validate the employee exit flow in Butler PMS.

Scenarios:
A. Employee with NO active tickets
B. Employee with IN_PROGRESS tickets
C. Employee with REVISION_REQUIRED tickets

🧪 Required validations:
1. EXIT_INITIATED state is applied correctly.
2. Tickets are:
   - Reassigned automatically
   - State moves to REASSIGNED
3. Confirm:
   - Iterations are NOT reset
   - SLA clocks are NOT reset
   - Ticket history remains intact
4. Verify audit log entries.

🐞 Debug rules:
- Fix only exit-related bugs.
- Do NOT modify ticket lifecycle.
- Do NOT delete or recreate tickets.

📤 Output required:
- Exit flow verification
- Reassignment correctness
- Test results
- ai_context.md update
