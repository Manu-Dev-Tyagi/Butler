import { ProjectPOC } from '@modules/projects/projects.types';
import { EventsService } from '@modules/events/events.service';

export interface ProjectCreatedEvent {
    project_id: string;
    project_name: string;
    client_id: string;
    pocs: ProjectPOC[];
}

export class ProjectEventPublisher {
    private eventsService: EventsService;

    constructor() {
        this.eventsService = new EventsService();
    }

    /**
     * Emit PROJECT_CREATED event
     * Inserts into DB queue for async cron processing
     */
    async emitProjectCreated(event: ProjectCreatedEvent): Promise<void> {
        await this.eventsService.publishEvent(
            'PROJECT_CREATED',
            'project',
            event.project_id,
            event
        );
    }
}
