PMS WIREFRAME WALKTHROUGH – SCREEN BY SCREEN (FINAL, DB-ALIGNED)
This walkthrough is fully aligned with the finalized normalized database schema and explains:
What each screen shows
Which tables power it
What actions are possible
How backend logic is triggered
This can be used directly for Figma, frontend stories, and CTO demos.

1. AUTH / LOGIN SCREEN
Who
All users
UI Elements
Email
Password
Login CTA
Backend
USER
Behavior
Auth validates credentials
Role-based redirect

2. ADMIN / PMO DASHBOARD (COMBINED ROLE)
Purpose
System-wide visibility & control
Powered By Tables
PROJECT
TICKET
SPRINT
FTR_METRIC
RED_ALERT
Sections
A. KPI CARDS
Active Projects
Open Tickets
Tickets at Risk
Avg Resolution Time
Overall FTR %
B. SPRINT ANALYTICS PANEL
Sprint selector
Delivered vs Delayed tickets
Iteration count heatmap
C. PROJECT OVERVIEW TABLE
Project Name
Client
POCs
Assigned Members (public)
Status
Actions
Create Project
Open Project Detail

3. CREATE PROJECT SCREEN
Fields
Project Name
Client
Add Project POCs (repeatable)
Name
Email
Phone
Tables Used
PROJECT
PROJECT_POC
Automation
Slack channel auto-created
Notifications sent

4. PROJECT DETAIL SCREEN
Tabs
A. OVERVIEW TAB
Project status
Client info
POC contact details
Slack channel link
Tables:
PROJECT
CLIENT
PROJECT_POC

B. MEMBERS TAB
Member name
Role
Department / Sub-department
Tables:
PROJECT_MEMBER
USER
USER_DEPARTMENT

C. TICKETS TAB
Ticket list
Filters (status, priority, sprint)
Tables:
TICKET
TICKET_ASSIGNMENT

D. RESPONSE SHEETS TAB
Generated sheets
Send to client action
Tables:
RESPONSE_SHEET

5. PROJECT MANAGER DASHBOARD
Purpose
Ticket orchestration
Sections
My Projects
Tickets pending assignment
Tickets pending approval
Red alerts
Tables:
PROJECT
TICKET
APPROVAL

6. CREATE TICKET SCREEN
Fields
Title
Description (min 15 chars)
Priority
Department & Sub-department
Sprint
Delivery Date (7 working days only)
Delivery Time Slot (dropdown)
Creative Count
Tables
TICKET
Validation
Ad Name mandatory before design live

7. EMPLOYEE DASHBOARD
Purpose
Execution-focused view
Sections
A. MY TICKETS
Ticket ID
Project
Status
Deadline
B. ALERTS
Revision required
SLA risk
C. LEAVE PORTAL BUTTON
Always visible
Tables:
TICKET
TICKET_ASSIGNMENT
RED_ALERT

8. TICKET DETAIL SCREEN
Sections
A. SUMMARY
Requirement
Priority
Delivery time
Tables:
TICKET

B. ITERATION TIMELINE
Iteration number
Outcome
Duration
Tables:
TICKET_ITERATION

C. FILES & COMMENTS
Upload files
View history
Tables:
FILE_ATTACHMENT
COMMENT

D. ACTIONS
Update status
Submit for approval
Tables:
APPROVAL

9. APPROVAL SCREEN (PM / ADMIN)
Shows
Submitted files
Comments
Actions
Approve
Request Revision
Backend Logic
YES → Iteration SUCCESS, FTR true
NO → New iteration, FTR false
Tables:
APPROVAL
TICKET_ITERATION
FTR_METRIC

10. DESIGN UPLOAD AUTOMATION
Trigger
Final creative upload
Automation
Tracker auto-update
Slack notification to posting team
Tables:
FILE_ATTACHMENT
NOTIFICATION

11. SPRINT ANALYTICS DASHBOARD
Metrics
Tickets per sprint
On-time delivery %
Avg iterations
FTR %
Tables:
SPRINT
TICKET
FTR_METRIC

12. RESPONSE SHEET SCREEN
Columns
Timestamp
Client
Requirement
End Date
Priority
POCs
Ad Name
Final Status
Avg Resolution Time
Tables:
RESPONSE_SHEET

13. LEAVE PORTAL FLOW (EMPLOYEE)
Step 1
Click Leave Portal
Step 2
Warning if active tickets
Step 3
Status → EXIT_INITIATED
Tables:
USER
TICKET_ASSIGNMENT

14. OFFBOARDING SCREEN (ADMIN)
Shows
Users with EXIT_INITIATED
Open ticket count
Actions
Reassign tickets
Complete offboarding
Tables:
USER
PROJECT_MEMBER
TICKET_ASSIGNMENT

15. NOTIFICATIONS PANEL
Channels
Slack
Email
In-app
Tables:
NOTIFICATION

FINAL NOTE
Every screen maps cleanly to normalized tables, ensuring:
No data duplication
Strong traceability
Analytics without side effects
This walkthrough is production-ready for design & development.

