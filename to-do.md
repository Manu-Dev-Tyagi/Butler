COMMENTS & FILES
APIs:
POST /tickets/:id/comments
GET  /tickets/:id/comments

POST /files/upload
GET  /tickets/:id/files

Rules:

Files always linked to iteration

Upload emits Slack update

📌 Agent instruction

Store file metadata only; blob storage abstracted.

COMMENTS & FILES
15. COMMENT APIs
API
Method
Purpose
Screens
/tickets/{id}/comments
POST
Add comment
Ticket Detail
/tickets/{id}/comments
GET
View comments
Ticket Detail




16. FILE APIs
API
Method
Purpose
Screens
/files/upload
POST
Upload file
Ticket Detail
/tickets/{id}/files
GET
View files
Ticket Detail

