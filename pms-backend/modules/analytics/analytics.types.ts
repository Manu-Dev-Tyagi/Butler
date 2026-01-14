// ==================== OVERVIEW ANALYTICS ====================

export interface OverviewAnalytics {
    summary: {
        total_tickets: number;
        total_projects: number;
        total_users: number;
        active_tickets: number;
    };
    ftr: {
        percentage: number;
        approved_first_time: number;
        total_completed: number;
    };
    resolution: {
        avg_hours: number;
        median_hours: number;
        fastest_hours: number;
        slowest_hours: number;
    };
    iterations: {
        avg_per_ticket: number;
        single_iteration_count: number;
        multiple_iterations_count: number;
    };
    status_distribution: Array<{
        status: string;
        count: number;
        percentage: number;
    }>;
    priority_distribution: Array<{
        priority: string;
        count: number;
        percentage: number;
    }>;
    recent_activity: {
        tickets_created_today: number;
        tickets_completed_today: number;
        tickets_in_progress: number;
    };
}

// ==================== SPRINT ANALYTICS ====================

export interface SprintAnalytics {
    sprint: {
        id: string;
        name: string;
        start_date: Date;
        end_date: Date;
        days_total: number;
        days_elapsed: number;
        days_remaining: number;
        is_active: boolean;
    };
    tickets: {
        total: number;
        completed: number;
        in_progress: number;
        pending: number;
        completion_rate: number;
    };
    ftr: {
        percentage: number;
        approved_first_time: number;
        required_revisions: number;
    };
    velocity: {
        tickets_per_day: number;
        estimated_completion_date: Date | null;
        on_track: boolean;
    };
    team: {
        members_count: number;
        tickets_per_member: number;
    };
    timeline: Array<{
        date: string;
        tickets_completed: number;
        cumulative_completed: number;
    }>;
}

// ==================== USER ANALYTICS ====================

export interface UserPerformance {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    tickets: {
        total_assigned: number;
        completed: number;
        in_progress: number;
        pending: number;
        completion_rate: number;
    };
    ftr: {
        percentage: number;
        approved_first_time: number;
        required_revisions: number;
    };
    performance: {
        avg_resolution_hours: number;
        avg_iterations_per_ticket: number;
        active_streak_days: number;
    };
    recent_tickets: Array<{
        id: string;
        title: string;
        status: string;
        priority: string;
        created_at: Date;
        completed_at: Date | null;
    }>;
}

export interface UsersAnalytics {
    summary: {
        total_users: number;
        active_users: number;
        avg_ftr: number;
        avg_resolution_hours: number;
    };
    leaderboard: Array<{
        user: {
            id: string;
            name: string;
            email: string;
        };
        metrics: {
            ftr_percentage: number;
            tickets_completed: number;
            avg_resolution_hours: number;
            rank: number;
        };
    }>;
    users: UserPerformance[];
}
