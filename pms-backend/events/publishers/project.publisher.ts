import { EventEmitter } from 'events';
import { ProjectPOC } from '@modules/projects/projects.types';

export interface ProjectCreatedEvent {
    project_id: string;
    project_name: string;
    client_id: string;
    pocs: ProjectPOC[];
}

// Global Event Emitter Instance
export const projectEventEmitter = new EventEmitter();

export class ProjectEventPublisher {
    /**
     * Emit PROJECT_CREATED event
     * Triggers async operations like Slack channel creation
     */
    emitProjectCreated(event: ProjectCreatedEvent): void {
        console.log('[EVENT] PROJECT_CREATED emitted:', event.project_id);
        projectEventEmitter.emit('PROJECT_CREATED', event);
    }
}
