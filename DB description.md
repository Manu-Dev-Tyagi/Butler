PMS DATABASE SCHEMA (NORMALIZED)
This document defines the fully normalized database schema for the Project Management System (PMS).
Design goals:
3rd Normal Form (3NF)
No data duplication
Strong referential integrity
Historical data preserved (offboarding-safe)
Analytics-friendly
Database assumption: PostgreSQL (works similarly for MySQL)

1. USER
Stores all employees. Users are never deleted.
Column
Type
Notes
id
UUID (PK)
Primary key
name
VARCHAR(150)
Employee name
email
VARCHAR(150)
Unique
role
ENUM
ADMIN, PM, EMPLOYEE
employment_status
ENUM
ACTIVE, EXIT_INITIATED, OFFBOARDED
is_assignable
BOOLEAN
False after exit
exit_requested_at
TIMESTAMP
Nullable
exit_effective_at
TIMESTAMP
Nullable
created_at
TIMESTAMP



Indexes:
UNIQUE(email)
INDEX(employment_status)

2. DEPARTMENT
Column
Type
id
UUID (PK)
name
VARCHAR(100)


3. SUB_DEPARTMENT
Column
Type
id
UUID (PK)
department_id
UUID (FK → department.id)
name
VARCHAR(100)

Indexes:
INDEX(department_id)

4. USER_DEPARTMENT (NORMALIZATION)
Allows flexible department assignment.
Column
Type
id
UUID (PK)
user_id
UUID (FK → user.id)
sub_department_id
UUID (FK → sub_department.id)


5. CLIENT
Column
Type
id
UUID (PK)
name
VARCHAR(150)


6. PROJECT
Column
Type
id
UUID (PK)
client_id
UUID (FK → client.id)
name
VARCHAR(150)
status
ENUM
created_at
TIMESTAMP


7. PROJECT_POC
Column
Type
id
UUID (PK)
project_id
UUID (FK → project.id)
name
VARCHAR(150)
email
VARCHAR(150)
phone
VARCHAR(20)

Indexes:
INDEX(project_id)

8. PROJECT_MEMBER
Tracks historical assignment of users to projects.
Column
Type
id
UUID (PK)
project_id
UUID (FK → project.id)
user_id
UUID (FK → user.id)
assigned_from
TIMESTAMP
assigned_to
TIMESTAMP
is_current
BOOLEAN


9. SPRINT
Column
Type
id
UUID (PK)
name
VARCHAR(100)
start_date
DATE
end_date
DATE


10. TICKET
Column
Type
id
UUID (PK)
project_id
UUID (FK → project.id)
sprint_id
UUID (FK → sprint.id)
title
VARCHAR(200)
description
TEXT
priority
ENUM
delivery_datetime
TIMESTAMP
delivery_slot
VARCHAR(50)
ad_name
VARCHAR(150)
creative_count
INT
status
ENUM
created_at
TIMESTAMP

Indexes:
INDEX(project_id)
INDEX(status)
INDEX(delivery_datetime)

11. TICKET_ASSIGNMENT
Ensures one active owner at a time.
Column
Type
id
UUID (PK)
ticket_id
UUID (FK → ticket.id)
user_id
UUID (FK → user.id)
assigned_at
TIMESTAMP
unassigned_at
TIMESTAMP
assignment_status
ENUM

Indexes:
INDEX(ticket_id)
INDEX(user_id)

12. TICKET_ITERATION
Column
Type
id
UUID (PK)
ticket_id
UUID (FK → ticket.id)
iteration_number
INT
outcome
ENUM
created_at
TIMESTAMP


13. APPROVAL
Column
Type
id
UUID (PK)
ticket_id
UUID (FK → ticket.id)
approved_by
UUID (FK → user.id)
status
ENUM
approved_at
TIMESTAMP


14. COMMENT
Column
Type
id
UUID (PK)
ticket_id
UUID (FK → ticket.id)
user_id
UUID (FK → user.id)
content
TEXT
created_at
TIMESTAMP


15. FILE_ATTACHMENT
Column
Type
id
UUID (PK)
ticket_id
UUID (FK → ticket.id)
file_url
TEXT
file_type
VARCHAR(50)
uploaded_by
UUID (FK → user.id)
uploaded_at
TIMESTAMP


16. FTR_METRIC
Column
Type
id
UUID (PK)
ticket_id
UUID (FK → ticket.id)
first_time_right
BOOLEAN
score
DECIMAL(5,2)


17. RED_ALERT
Column
Type
id
UUID (PK)
ticket_id
UUID (FK → ticket.id)
reason
TEXT
triggered_at
TIMESTAMP


18. NOTIFICATION
Column
Type
id
UUID (PK)
ticket_id
UUID (FK → ticket.id)
channel
ENUM
status
ENUM
sent_at
TIMESTAMP


19. RESPONSE_SHEET
Column
Type
id
UUID (PK)
project_id
UUID (FK → project.id)
generated_at
TIMESTAMP
avg_resolution_time
DECIMAL(6,2)


NORMALIZATION SUMMARY
No repeating groups (1NF)
No partial dependencies (2NF)
No transitive dependencies (3NF)
History preserved via junction tables
Analytics isolated from transactional writes

FINAL NOTE
This schema is enterprise-grade, scalable, and ready for:
Migrations
API development
BI / analytics pipelines
CTO review

