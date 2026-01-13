COMPLETE PMS FLOW – FINAL (END-TO-END)

1. SYSTEM OVERVIEW (WHAT THIS PMS IS)
This PMS is a structured, analytics-driven ticketing and execution system focused on:
Productivity


Accountability


First Time Right (FTR)


Iteration reduction


Sprint-based delivery analysis


Clear ownership even during employee exits


It is not just task management, it is a controlled execution framework.

2. ROLES & VISIBILITY MODEL
Roles
Admin / PMO (combined)


Full system visibility


Project creation


Approval authority


Sprint & analytics view


Project Manager


Project-level control


Ticket creation & assignment


Approval & client communication


Employee / Member


Execution-only view


Update ticket status


Upload files


Request leave (exit portal)



3. EMPLOYEE ONBOARDING FLOW
Employee signs up / is created by Admin


System stores:


Name


Email


Role


Department


Sub-department


Employee status = ACTIVE


Tickets shown to employee only if:


Department + sub-department match


Employee is assigned


👉 No manual filtering needed later.

4. PROJECT CREATION FLOW (ADMIN / PMO)
Step 1: Create Project
Admin/PMO enters:
Project Name


Client Name


One or more POCs


Name


Email


Phone


Step 2: Automation
Project is created


Slack channel auto-created (#project-name)


POCs stored at project level


Notifications sent to PMs


Step 3: Visibility Rule
All assigned members of the project are visible to everyone


No hidden ownership



5. PROJECT STRUCTURE AFTER CREATION
Each project contains:
Members (cross-department)


Tickets


Sprints


Response sheets


Slack channel


Client POCs


This becomes the execution boundary.

6. TICKET CREATION FLOW (PROJECT MANAGER)
Step 1: Create Ticket
PM enters:
Title


Description (min 15 characters – enforced)


Priority


Department & Sub-department


Sprint


Delivery Date (restricted to next 7 working days)


Delivery Time (dropdown)


Creative count (if applicable)


Step 2: System Validations
Date rules enforced


Ad Name mandatory before design goes live


Ticket state = CREATED



7. TICKET ASSIGNMENT FLOW
PM assigns ticket to employee(s)


Ticket state → ASSIGNED


Employee sees it in My Tickets


Slack + email notification sent



8. EMPLOYEE EXECUTION FLOW
Step 1: Start Work
Employee accepts ticket


Ticket state → IN_PROGRESS


Step 2: Work Actions
Employee can:
Upload files


Add comments


Update progress


See deadline & priority


Every action is logged.

9. SUBMISSION & APPROVAL FLOW (YES / NO ROUTING)
Step 1: Submit Work
Employee submits work:
Files mandatory


Comment optional


Ticket state → SUBMITTED


Iteration 1 created (if first submit)



Step 2: Approval Decision (PM / Admin)
✅ YES PATH (Approved)
Flow:
SUBMITTED → APPROVED → DELIVERED → CLOSED

Effects:
Ticket marked successful


If Iteration = 1 → FTR = TRUE


SLA success


Notifications sent


Ticket locked



❌ NO PATH (Revision Required)
Flow:
SUBMITTED → REVISION_REQUIRED → IN_PROGRESS

Effects:
New iteration created


FTR permanently FALSE


Red alert evaluation


Employee reworks task


👉 Each rejection = accountability & traceability

10. ITERATION LOGIC (VERY IMPORTANT)
Iterations are not new tickets


Each iteration stores:


Start time


End time


Decision


Duration


Max iterations configurable


Iteration count feeds:


FTR


Red alerts


Employee performance



11. RED ALERT SYSTEM
Red alert triggered when:
Iterations > threshold


Delivery date crossed


Ticket idle too long


Effects:
Highlighted in dashboards


Slack + email alerts


Visible to Admin & PM


This helps identify systemic issues, not just delays.

12. DESIGN UPLOAD → POSTING AUTOMATION
When final creatives are uploaded:
Tracker auto-updated


Slack message sent to posting team


Posting tickets are no longer raised manually


This eliminates operational leakage.

13. EMPLOYEE LEAVE / EXIT FLOW (CRITICAL)
Leave Portal (Visible Everywhere)
Employee can click Leave Portal anytime.
If no active tickets:
Status → EXITED


If active tickets:
Status → EXIT_INITIATED


Tickets auto-reassigned


Ticket state → REASSIGNED


Iterations continue without reset


👉 No data loss. No SLA corruption.

14. OFFBOARDING FLOW (ADMIN)
Admin sees:
Employees with EXIT_INITIATED


Their open tickets


Admin actions:
Reassign tickets


Finalize exit



15. SPRINT DASHBOARD (ADMIN / PMO)
Sprint analytics show:
Tickets committed vs delivered


On-time delivery %


Avg iterations


FTR %


Delay heatmap


Sprint does not control ticket state — only analysis.

16. RESPONSE SHEET FLOW (CLIENT COMMUNICATION)
PM/Admin can:
Generate monthly response sheet


Auto-fill:


Requirement


Priority


End date


Ad name


Final status


Avg resolution time


Send directly to client via email


This replaces manual reporting.

17. ANALYTICS & PERFORMANCE VIEW
Ticket-level
SLA


Iterations


Resolution time


Employee-level
FTR %


Avg iterations


Productivity trend


Project-level
Delay hotspots


Requirement repetition


Efficiency improvement areas



18. NOTIFICATIONS SYSTEM
Triggered on:
Assignment


Submission


Approval / rejection


Delay


Exit


Red alert


Channels:
Slack


Email


In-app


Event-driven, not manual.

19. WHY THIS FLOW IS INDUSTRY-GRADE
✔ Clear ownership
 ✔ No hidden states
 ✔ Exit-safe
 ✔ Analytics trustworthy
 ✔ Scales across teams
 ✔ CTO-defensible
This is closer to Jira + Asana + internal agency workflow, but optimized for creative & tech organizations.

FINAL WORD (IMPORTANT)
At this point, you are not confused anymore — you have:
A clean mental model


A buildable architecture


A defensible product story







TICKET LIFECYCLE STATE MACHINE (DIAGRAM + RULES)
This document defines the single source of truth for how a ticket behaves in the PMS.
It is critical for:
Backend validation
Frontend UI state control
Analytics (FTR, SLA, Red Alerts)
CTO / Architecture review

1. CORE PRINCIPLES
A ticket can only be in one state at a time
State transitions are event-driven (user or system)
Every transition is logged
Iterations are children of a ticket, not new tickets
Employee exit does NOT break ticket continuity

2. MASTER TICKET STATES
State
Meaning
CREATED
Ticket raised by PM/Admin
ASSIGNED
Owner(s) assigned
IN_PROGRESS
Work started
SUBMITTED
Work submitted for approval
APPROVED
Accepted by PM/Admin
REVISION_REQUIRED
Changes requested
REASSIGNED
Owner changed
DELIVERED
Final delivery done
CLOSED
Ticket officially closed
CANCELLED
Ticket voided


3. TICKET LIFECYCLE – MERMAID STATE DIAGRAM
stateDiagram-v2
    [*] --> CREATED

    CREATED --> ASSIGNED : Assign Owner
    ASSIGNED --> IN_PROGRESS : Work Start

    IN_PROGRESS --> SUBMITTED : Submit Work
    SUBMITTED --> APPROVED : Approval = YES
    SUBMITTED --> REVISION_REQUIRED : Approval = NO

    REVISION_REQUIRED --> IN_PROGRESS : New Iteration

    APPROVED --> DELIVERED : Final Upload
    DELIVERED --> CLOSED : PM/Admin Close

    IN_PROGRESS --> REASSIGNED : Owner Exit/Reassign
    REASSIGNED --> IN_PROGRESS : New Owner Accepts

    CREATED --> CANCELLED : Cancel Ticket
    ASSIGNED --> CANCELLED
    IN_PROGRESS --> CANCELLED


4. ITERATION RULES (VERY IMPORTANT)
What is an Iteration?
An iteration represents one attempt to complete the ticket.
Rule
Explanation
Iteration 1
Created automatically on first submit
New iteration
Created ONLY on REVISION_REQUIRED
Max iterations
Configurable (default 5)
Iteration end
Approval decision

FTR Logic
If approved in Iteration 1 → FTR = TRUE
If iteration > 1 → FTR = FALSE

5. APPROVAL DECISION LOGIC
YES Path
SUBMITTED → APPROVED → DELIVERED → CLOSED

Effects:
Ticket SLA success
FTR marked TRUE (if iteration 1)
Notifications sent

NO Path (Revision Required)
SUBMITTED → REVISION_REQUIRED → IN_PROGRESS

Effects:
New iteration created
Red Alert check
FTR permanently FALSE

6. EMPLOYEE EXIT IMPACT (CRITICAL)
Scenario: Employee clicks "Leave Portal"
If employee has:
A. No active tickets
Status → EXITED
B. Active tickets
Tickets → REASSIGNED
Ticket state → REASSIGNED
Iteration continues
Ticket NEVER moves backwards or resets.

7. RED ALERT RULES
Red alert triggered if:
Condition
Threshold
Iterations
> 2
SLA breach
Delivery date crossed
Idle time
No update for X hours

Red Alert Effects:
Highlight in dashboards
Slack & Email notification

8. SPRINT INTERACTION
Ticket belongs to ONE sprint
Sprint does NOT control ticket state
Sprint analytics read-only

9. SYSTEM-ENFORCED GUARDS
Rule
Enforced At
Cannot submit without files
API
Cannot approve without comment
API
Cannot close without delivery
API
Cannot assign exited user
API


10. STATE ↔ UI MAPPING
State
UI Behavior
CREATED
Editable
ASSIGNED
View only
IN_PROGRESS
Upload, comment
SUBMITTED
Read only
REVISION_REQUIRED
Highlighted
APPROVED
Locked
DELIVERED
Locked
CLOSED
Archived


FINAL NOTE
This state machine:
Eliminates ambiguity
Prevents inconsistent analytics
Scales safely
Is fully auditable
This is mandatory reading for backend, frontend, QA, and PM teams.

