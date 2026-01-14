-- Butler PMS Database Schema (PostgreSQL)
-- Generated based on DB description.md
-- 3NF Normalized Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
-- Stores all employees. Users are never deleted.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'PM', 'EMPLOYEE')),
    employment_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (employment_status IN ('ACTIVE', 'EXIT_INITIATED', 'OFFBOARDED')),
    is_assignable BOOLEAN DEFAULT TRUE,
    exit_requested_at TIMESTAMP,
    exit_effective_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_employment_status ON users(employment_status);

-- 2. DEPARTMENTS
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL
);

-- 3. SUB_DEPARTMENTS
CREATE TABLE sub_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id),
    name VARCHAR(100) NOT NULL
);

CREATE INDEX idx_sub_dept_department_id ON sub_departments(department_id);

-- 4. USER_DEPARTMENTS (Junction)
CREATE TABLE user_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    sub_department_id UUID NOT NULL REFERENCES sub_departments(id)
);

-- 5. CLIENTS
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL
);

-- 6. PROJECTS
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id),
    name VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. PROJECT_POCS
CREATE TABLE project_pocs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20)
);

CREATE INDEX idx_project_pocs_project_id ON project_pocs(project_id);

-- 8. PROJECT_MEMBERS (Historical Assignment)
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    user_id UUID NOT NULL REFERENCES users(id),
    assigned_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to TIMESTAMP,
    is_current BOOLEAN DEFAULT TRUE
);

-- 9. SPRINTS
CREATE TABLE sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- 10. TICKETS
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    sprint_id UUID REFERENCES sprints(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    delivery_datetime TIMESTAMP,
    delivery_slot VARCHAR(50),
    ad_name VARCHAR(150),
    creative_count INT,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REVISION_REQUIRED', 'REASSIGNED', 'DELIVERED', 'CLOSED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tickets_project_id ON tickets(project_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_delivery_datetime ON tickets(delivery_datetime);

-- 11. TICKET_ASSIGNMENTS (Active Owner History)
CREATE TABLE ticket_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    user_id UUID NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TIMESTAMP,
    assignment_status VARCHAR(50) DEFAULT 'ACTIVE'
);

CREATE INDEX idx_ticket_assignments_ticket_id ON ticket_assignments(ticket_id);
CREATE INDEX idx_ticket_assignments_user_id ON ticket_assignments(user_id);

-- 12. TICKET_ITERATIONS
CREATE TABLE ticket_iterations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    iteration_number INT NOT NULL,
    outcome VARCHAR(50) CHECK (outcome IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. APPROVALS
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    approved_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('APPROVED', 'REJECTED')),
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. COMMENTS
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. FILE_ATTACHMENTS
CREATE TABLE file_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    iteration_id UUID REFERENCES ticket_iterations(id),
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. FTR_METRICS
CREATE TABLE ftr_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL UNIQUE REFERENCES tickets(id),
    first_time_right BOOLEAN DEFAULT FALSE,
    score DECIMAL(5,2)
);

-- 17. RED_ALERTS
CREATE TABLE red_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    reason TEXT NOT NULL,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. EVENTS (Event Queue for Cron-Based Processing)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'DONE', 'FAILED')),
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_entity ON events(entity_type, entity_id);
CREATE INDEX idx_events_created_at ON events(created_at);

-- 19. NOTIFICATIONS (In-App Notifications)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    ticket_id UUID REFERENCES tickets(id),
    title VARCHAR(255),
    message TEXT,
    event_type VARCHAR(100),
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- 20. RESPONSE_SHEETS
CREATE TABLE response_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    snapshot_data JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    sent_to TEXT[],
    avg_resolution_time DECIMAL(6,2)
);

CREATE INDEX idx_response_sheets_project_id ON response_sheets(project_id);
CREATE INDEX idx_response_sheets_generated_at ON response_sheets(generated_at);
