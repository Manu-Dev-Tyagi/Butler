import { AnalyticsRepository } from './analytics.repository';
import { OverviewAnalytics, SprintAnalytics, UsersAnalytics, UserPerformance } from './analytics.types';

export class AnalyticsService {
    private repository: AnalyticsRepository;

    constructor() {
        this.repository = new AnalyticsRepository();
    }

    // ==================== OVERVIEW ANALYTICS ====================

    async getOverviewAnalytics(): Promise<OverviewAnalytics> {
        try {
            const analytics = await this.repository.getOverviewAnalytics();
            return analytics;
        } catch (error) {
            console.error('[AnalyticsService] Error fetching overview analytics:', error);
            throw new Error('Failed to fetch overview analytics');
        }
    }

    // ==================== SPRINT ANALYTICS ====================

    async getSprintAnalytics(sprintId: string): Promise<SprintAnalytics> {
        if (!sprintId) {
            throw new Error('Sprint ID is required');
        }

        try {
            const analytics = await this.repository.getSprintAnalytics(sprintId);
            return analytics;
        } catch (error) {
            console.error(`[AnalyticsService] Error fetching sprint analytics for sprint ${sprintId}:`, error);
            if (error instanceof Error && error.message.includes('not found')) {
                throw error; // Re-throw 404 errors
            }
            throw new Error('Failed to fetch sprint analytics');
        }
    }

    // ==================== USER ANALYTICS ====================

    async getUsersAnalytics(): Promise<UsersAnalytics> {
        try {
            const analytics = await this.repository.getUsersAnalytics();
            return analytics;
        } catch (error) {
            console.error('[AnalyticsService] Error fetching users analytics:', error);
            throw new Error('Failed to fetch users analytics');
        }
    }

    async getUserPerformance(userId: string): Promise<UserPerformance> {
        if (!userId) {
            throw new Error('User ID is required');
        }

        try {
            const performance = await this.repository.getUserPerformance(userId);
            return performance;
        } catch (error) {
            console.error(`[AnalyticsService] Error fetching user performance for user ${userId}:`, error);
            if (error instanceof Error && error.message.includes('not found')) {
                throw error; // Re-throw 404 errors
            }
            throw new Error('Failed to fetch user performance');
        }
    }
}
