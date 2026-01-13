export async function handleProjectCreated(event: any) {
    const { project_id, project_name, client_id, pocs } = event.payload;

    console.log(`[HANDLER] Processing PROJECT_CREATED for project ${project_name} (${project_id})`);

    // 1. Slack Channel Creation Placeholder
    console.log(`[SLACK] (MOCK) Creating channel #project-${project_name.toLowerCase().replace(/\s+/g, '-')}`);

    // 2. Invite POCs Placeholder
    pocs.forEach((poc: any) => {
        console.log(`[SLACK] (MOCK) Inviting ${poc.name} (${poc.email}) to channel`);
    });
}
