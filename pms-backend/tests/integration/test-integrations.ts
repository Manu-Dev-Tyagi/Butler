/**
 * Integration Services Test
 * Tests Slack and Email services (will show as "disabled" unless configured)
 */

import { SlackService } from '@integrations/slack.service';
import { EmailService } from '@integrations/email.service';

async function testIntegrations() {
    console.log('🧪 Testing Integration Services...\n');

    // Test Slack Service
    console.log('--- Testing Slack Service ---');
    const slackService = new SlackService();

    try {
        await slackService.sendNotification('Test notification from Butler PMS');
        console.log('✅ Slack service initialized successfully\n');
    } catch (error: any) {
        console.error('❌ Slack service error:', error.message);
    }

    // Test Email Service
    console.log('--- Testing Email Service ---');
    const emailService = new EmailService();

    try {
        await emailService.sendEmail({
            to: 'test@example.com',
            subject: 'Test Email',
            html: '<p>This is a test email from Butler PMS</p>',
        });
        console.log('✅ Email service initialized successfully\n');
    } catch (error: any) {
        console.error('❌ Email service error:', error.message);
    }

    // Test Slack Notification Methods
    console.log('--- Testing Slack Notification Methods ---');
    try {
        await slackService.notifyTicketAssigned({
            ticketTitle: 'Test Ticket',
            ticketId: 'test-123',
            assigneeName: 'John Doe',
            assigneeEmail: 'john@example.com',
            priority: 'HIGH',
            projectName: 'Test Project',
        });
        console.log('✅ notifyTicketAssigned works\n');

        await slackService.notifyIterationSubmitted({
            ticketTitle: 'Test Ticket',
            ticketId: 'test-123',
            iterationNumber: 1,
            submittedBy: 'John Doe',
        });
        console.log('✅ notifyIterationSubmitted works\n');

        await slackService.notifyIterationApproved({
            ticketTitle: 'Test Ticket',
            ticketId: 'test-123',
            iterationNumber: 1,
            approvedBy: 'Jane Manager',
            ftr: true,
        });
        console.log('✅ notifyIterationApproved works\n');

        await slackService.notifyIterationRejected({
            ticketTitle: 'Test Ticket',
            ticketId: 'test-123',
            iterationNumber: 1,
            rejectedBy: 'Jane Manager',
            reason: 'Needs improvement',
        });
        console.log('✅ notifyIterationRejected works\n');

        await slackService.notifyProjectCreated({
            projectName: 'Test Project',
            projectId: 'proj-123',
            clientName: 'Test Client',
            memberCount: 5,
        });
        console.log('✅ notifyProjectCreated works\n');
    } catch (error: any) {
        console.error('❌ Slack notification method error:', error.message);
    }

    // Test Email Notification Methods
    console.log('--- Testing Email Notification Methods ---');
    try {
        await emailService.sendTicketAssignedEmail({
            to: 'test@example.com',
            assigneeName: 'John Doe',
            ticketTitle: 'Test Ticket',
            ticketId: 'test-123',
            priority: 'HIGH',
            projectName: 'Test Project',
        });
        console.log('✅ sendTicketAssignedEmail works\n');

        await emailService.sendIterationSubmittedEmail({
            to: 'test@example.com',
            assigneeName: 'John Doe',
            ticketTitle: 'Test Ticket',
            ticketId: 'test-123',
            iterationNumber: 1,
        });
        console.log('✅ sendIterationSubmittedEmail works\n');

        await emailService.sendIterationApprovedEmail({
            to: 'test@example.com',
            assigneeName: 'John Doe',
            ticketTitle: 'Test Ticket',
            ticketId: 'test-123',
            iterationNumber: 1,
            approverName: 'Jane Manager',
            ftr: true,
        });
        console.log('✅ sendIterationApprovedEmail works\n');

        await emailService.sendIterationRejectedEmail({
            to: 'test@example.com',
            assigneeName: 'John Doe',
            ticketTitle: 'Test Ticket',
            ticketId: 'test-123',
            iterationNumber: 1,
            approverName: 'Jane Manager',
            reason: 'Needs improvement',
        });
        console.log('✅ sendIterationRejectedEmail works\n');

        await emailService.sendProjectCreatedEmail({
            to: ['test1@example.com', 'test2@example.com'],
            projectName: 'Test Project',
            projectId: 'proj-123',
            clientName: 'Test Client',
        });
        console.log('✅ sendProjectCreatedEmail works\n');
    } catch (error: any) {
        console.error('❌ Email notification method error:', error.message);
    }

    console.log('='.repeat(50));
    console.log('✅ Integration Services Test Complete!');
    console.log('='.repeat(50));
    console.log('\n📝 Note: If integrations are disabled in .env,');
    console.log('   all notifications will show as "Skipped (disabled)"');
    console.log('\n📝 To enable integrations:');
    console.log('   1. Set SLACK_ENABLED=true and configure SLACK_WEBHOOK_URL');
    console.log('   2. Set EMAIL_ENABLED=true and configure EMAIL_* variables');
}

testIntegrations()
    .then(() => {
        console.log('\n✅ Test completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    });
