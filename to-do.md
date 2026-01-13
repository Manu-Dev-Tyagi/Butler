PROTOTYPE-FRIENDLY DESIGN (CRON INSTEAD OF QUEUE)
High-Level Flow
API Action
   ↓
Event stored in DB (events table)
   ↓
Cron Job (every 1 min)
   ↓
Process unhandled events
   ↓
Slack / Email / Notifications


📌 This is async, decoupled, and CTO-safe

1️⃣ CORE TABLES (MINIMAL)
1. events (QUEUE REPLACEMENT)
events
- id (uuid)
- event_type
- entity_type
- entity_id
- payload (json)
- status (PENDING | PROCESSING | DONE | FAILED)
- retry_count
- created_at
- processed_at


This is your temporary event queue.

2. notifications
notifications
- id
- user_id
- title
- message
- event_type
- entity_id
- is_read
- created_at

2️⃣ API SIDE (VERY FAST TO BUILD)
Example: Ticket Assigned
POST /tickets/:id/assign

API Responsibilities ONLY:
1. Update ticket
2. Insert event row
3. Return response

await db.events.insert({
  event_type: "TICKET_ASSIGNED",
  entity_type: "ticket",
  entity_id: ticketId,
  payload: { assigned_to: agentId },
  status: "PENDING"
})


❌ No Slack
❌ No Email
❌ No Notification logic

3️⃣ CRON JOB (THE HEART OF THIS)
Run Every 1 Minute
* * * * *

Pseudo Logic
events = fetch events where status = 'PENDING' limit 20

for event in events:
  mark PROCESSING
  try:
    handleEvent(event)
    mark DONE
  catch:
    increment retry_count
    mark FAILED if retry_count > 3


📌 This mimics real queue behavior.

4️⃣ EVENT HANDLER (SWITCH CASE = FASTEST)
function handleEvent(event) {
  switch(event.event_type) {

    case "TICKET_ASSIGNED":
      handleTicketAssigned(event)
      break

    case "RED_ALERT_TRIGGERED":
      handleRedAlert(event)
      break
  }
}

5️⃣ SLACK (ASYNC VIA CRON)
When to Send Slack
Event	Slack
TICKET_ASSIGNED	✅
TICKET_APPROVED	❌
RED_ALERT_TRIGGERED	✅
USER_EXIT_INITIATED	✅
function handleTicketAssigned(event) {
  sendSlack(
    `🎫 Ticket assigned to <@${agentSlackId}>`
  )
}


📌 CTO will care that:

Slack is not in API, it’s async

6️⃣ EMAIL (OPTIONAL / SAME CRON)

You can keep this super light.

if (event.event_type === "RED_ALERT_TRIGGERED") {
  sendEmail(adminEmails, template)
}

7️⃣ NOTIFICATION TABLE (MANDATORY)
insert notification for affected users


This powers:

GET /notifications

8️⃣ NOTIFICATION API (READ-ONLY)
GET /notifications


Features:

List notifications

Unread badge count

Mark as read

📌 Simple SQL, no async here.

9️⃣ WHAT YOU TELL THE CTO (IMPORTANT)

“We’re using a cron-based event processor for the prototype.
The system is fully event-driven — replacing this with Kafka or SQS is just a consumer swap.”

This line instantly removes technical objections.

🔟 WHAT NOT TO BUILD (SAVE TIME)

❌ Rule engines
❌ DLQs
❌ Kafka
❌ Webhooks abstraction
❌ Multi-tenant Slack configs

1️⃣1️⃣ WHAT YOU MUST SHOW IN DEMO

Ticket assigned → event row created

Cron runs → Slack message arrives

Notification appears in UI

API never touches Slack

That’s it.

1️⃣2️⃣ CURSOR / AGENTIC AI INSTRUCTION (SHORT)

• Explore codebase
• Add events table
• Emit events from APIs
• Build cron processor
• Never call Slack inside API
• Log all failures
• Keep logic simple and readable