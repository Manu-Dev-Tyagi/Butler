import { projectEventEmitter, ProjectCreatedEvent } from '../publishers/project.publisher';

/**
 * PROJECT_CREATED Event Subscriber
 * Handles async operations triggered by project creation
 */
class ProjectSubscriber {
    constructor() {
        this.subscribeToProjectCreated();
    }

    private subscribeToProjectCreated(): void {
        projectEventEmitter.on('PROJECT_CREATED', this.handleProjectCreated.bind(this));
    }

    private async handleProjectCreated(event: ProjectCreatedEvent): Promise<void> {
        console.log('[SUBSCRIBER] Handling PROJECT_CREATED:', event.project_id);

        try {
            // 1. Create Slack Channel (Placeholder - will integrate with Slack API)
            await this.createSlackChannel(event);

            // 2. Send notification to POCs (if email service available)
            // await this.notifyPOCs(event);

            console.log('[SUBSCRIBER] PROJECT_CREATED handled successfully:', event.project_id);
        } catch (error: any) {
            console.error('[SUBSCRIBER] Error handling PROJECT_CREATED:', error.message);
        }
    }

    /**
     * Placeholder for Slack Channel Creation
     * TODO: Integrate with actual Slack API (@integrations/slack/slack.client.ts)
     */
    private async createSlackChannel(event: ProjectCreatedEvent): Promise<void> {
        // Simulate async Slack channel creation
        const channelName = `project-${event.project_name.toLowerCase().replace(/\s+/g, '-')}`;
        console.log(`[SLACK] (Simulated) Creating channel: #${channelName}`);

        // In production, this would call:
        // const slackClient = new SlackClient();
        // await slackClient.createChannel(channelName, event.pocs);
    }
}

// Initialize subscriber on module load
export const projectSubscriber = new ProjectSubscriber();
