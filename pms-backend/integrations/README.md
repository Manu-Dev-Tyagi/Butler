# Butler PMS External Integrations

This directory contains external service integrations for Butler PMS notification system.

## Overview

Butler PMS uses an **event-driven architecture** to send notifications via multiple channels:
- **Slack** - Team collaboration notifications
- **Email** - Professional email notifications to users

All integrations are:
- ✅ **Disabled by default** (opt-in via `.env`)
- ✅ **Non-blocking** (failures don't break business logic)
- ✅ **Asynchronous** (processed by worker, not API)
- ✅ **Gracefully degrading** (logs errors but continues)

## Architecture

```
API Request → Event Published → DB Queue → Worker → Handler → Integration Service → External Service
                                   ↓
                          In-App Notification
```

**Flow**:
1. API service publishes events to DB-backed queue (`events` table)
2. Worker process polls queue every minute (cron job)
3. Event handlers fetch additional context (names, emails) from DB
4. Handlers call integration services (Slack + Email)
5. Integration services send notifications to external platforms

## Services

### 1. Slack Service (`slack.service.ts`)

**Features**:
- Uses Slack Incoming Webhooks (no OAuth required)
- Rich message formatting with attachments
- Priority color coding (🔴 Urgent, 🟠 High, 🟡 Medium, 🟢 Low)
- Emoji indicators for event types

**Notifications**:
- `notifyTicketAssigned()` - New ticket assignment with priority
- `notifyIterationSubmitted()` - Draft submitted for review
- `notifyIterationApproved()` - Approval with FTR status
- `notifyIterationRejected()` - Revision required with reason
- `notifyProjectCreated()` - New project kickoff

**Configuration** (`.env`):
```env
SLACK_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Setup**:
1. Go to https://api.slack.com/apps
2. Create new app → Incoming Webhooks → Enable
3. Add Webhook to Workspace → Select channel
4. Copy Webhook URL to `.env`

### 2. Email Service (`email.service.ts`)

**Features**:
- Supports multiple providers (SMTP, Gmail, SendGrid)
- Professional HTML email templates
- Responsive design with company branding
- Plain text fallback for compatibility

**Notifications**:
- `sendTicketAssignedEmail()` - Ticket assignment with details
- `sendIterationSubmittedEmail()` - Submission confirmation
- `sendIterationApprovedEmail()` - Approval with FTR badge
- `sendIterationRejectedEmail()` - Revision request with feedback
- `sendProjectCreatedEmail()` - Bulk email to team members

**Configuration** (`.env`):

**Option 1: Gmail**
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=gmail
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Butler PMS
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

**Option 2: SendGrid**
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Butler PMS
SENDGRID_API_KEY=SG.your_api_key_here
```

**Option 3: Generic SMTP**
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Butler PMS
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

## Event Handlers

Located in `jobs/handlers/`:

### `iteration.handler.ts`
- Handles: `ITERATION_SUBMITTED`, `ITERATION_APPROVED`, `ITERATION_REJECTED`
- Fetches: Ticket details, user details, approver details, FTR metrics
- Sends: In-app notification + Slack message + Email

### `ticket.handler.ts`
- Handles: `TICKET_ASSIGNED`
- Fetches: User details, project details
- Sends: In-app notification + Slack message + Email

### `project.handler.ts`
- Handles: `PROJECT_CREATED`
- Fetches: Client details, team member details
- Sends: Slack announcement + Bulk email to team

## Testing

### Unit Test (Standalone)
Tests integration services in isolation:
```bash
npx ts-node -r tsconfig-paths/register tests/integration/test-integrations.ts
```

### Integration Test (End-to-End)
Tests full flow with API + Worker:
```bash
# Terminal 1: Start API
npm run dev:api

# Terminal 2: Start Worker
npm run dev:worker

# Terminal 3: Run tests
npx ts-node -r tsconfig-paths/register tests/integration/iterations_approvals.test.ts
```

Check worker logs to verify notifications:
```bash
tail -f /tmp/butler-worker.log | grep -E "(SLACK|EMAIL)"
```

## Error Handling

All integration services follow this pattern:

```typescript
async sendNotification() {
    if (!this.enabled) {
        console.log('[SERVICE] Skipped (disabled)');
        return;
    }

    try {
        await externalService.send();
        console.log('[SERVICE] Success');
    } catch (error) {
        console.error('[SERVICE] Failed:', error.message);
        // DON'T throw - we don't want integration failures to break business logic
    }
}
```

**Key Principles**:
- Failures are logged but never thrown
- Business logic (DB writes, state transitions) always succeeds
- Users get in-app notifications even if Slack/Email fail

## Adding New Integrations

To add a new integration (e.g., SMS, Microsoft Teams):

1. **Create Service** (`integrations/sms.service.ts`):
   ```typescript
   export class SmsService {
       private enabled: boolean;

       constructor() {
           this.enabled = process.env.SMS_ENABLED === 'true';
       }

       async sendSms(to: string, message: string) {
           if (!this.enabled) return;
           // Implementation
       }
   }
   ```

2. **Update Handler** (`jobs/handlers/iteration.handler.ts`):
   ```typescript
   import { SmsService } from '@integrations/sms.service';
   const smsService = new SmsService();

   await smsService.sendSms(user.phone, 'Iteration approved!');
   ```

3. **Add Configuration** (`.env`):
   ```env
   SMS_ENABLED=false
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   ```

4. **Document** (Update this README)

## Production Deployment

**Checklist**:
- [ ] Set up Slack App and get Webhook URL
- [ ] Configure Email provider (SendGrid recommended for production)
- [ ] Update `.env` with production credentials
- [ ] Test with `EMAIL_ENABLED=true` and `SLACK_ENABLED=true`
- [ ] Monitor worker logs for integration errors
- [ ] Set up alerting for repeated failures (e.g., > 10 failed emails/hour)

**Security**:
- Never commit `.env` to version control
- Use environment variable management (e.g., AWS Secrets Manager, Vault)
- Rotate API keys regularly
- Use separate credentials for staging/production

## Monitoring

Key metrics to track:
- **Event Processing Time**: How long events wait in queue
- **Integration Success Rate**: % of Slack/Email sends that succeed
- **Notification Latency**: Time from API call to notification delivered
- **Error Rate by Integration**: Which service fails most often

**Logs to watch**:
```bash
# Integration skips (disabled)
grep "Skipped (disabled)" /tmp/butler-worker.log

# Integration errors
grep "Failed to send" /tmp/butler-worker.log

# Successful notifications
grep "successfully notified" /tmp/butler-worker.log
```

## Troubleshooting

**Problem**: Slack notifications not appearing
- Check `SLACK_ENABLED=true` in `.env`
- Verify webhook URL is correct
- Test webhook with curl:
  ```bash
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Test from Butler"}' \
    YOUR_WEBHOOK_URL
  ```

**Problem**: Gmail emails not sending
- Ensure 2FA is enabled on Google account
- Use App Password (not regular password)
- Check "Less secure app access" setting

**Problem**: Worker not processing events
- Check worker is running: `ps aux | grep worker.ts`
- Check cron job logs: `tail -f /tmp/butler-worker.log`
- Verify events are in DB: `SELECT * FROM events WHERE status='PENDING'`

**Problem**: Emails marked as spam
- Set up SPF, DKIM, DMARC records for your domain
- Use a reputable email provider (SendGrid, AWS SES)
- Avoid spammy language in email content
- Include unsubscribe link (for production)

## Future Enhancements

Potential additions:
- **SMS Integration** (Twilio, AWS SNS)
- **Microsoft Teams** (Incoming Webhooks)
- **Push Notifications** (Firebase Cloud Messaging)
- **Slack Bot** (for two-way interactions, requires Bot Token)
- **Digest Emails** (Daily/Weekly summaries instead of per-event)
- **Notification Preferences** (User can choose channels per event type)
- **Rate Limiting** (Prevent notification spam)
- **A/B Testing** (Test different message formats)

## References

- Slack Incoming Webhooks: https://api.slack.com/messaging/webhooks
- Nodemailer Documentation: https://nodemailer.com/
- SendGrid Node.js Guide: https://docs.sendgrid.com/for-developers/sending-email/nodejs
- Event-Driven Architecture: https://martinfowler.com/articles/201701-event-driven.html
