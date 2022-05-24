## ATC SMS
* Send SMS to users through API with Basic Authentication
* Limit 50 SMS from an user within 24 hours
* Prevent sending SMS to users prompted out using STOP inbound message

### Tools/Technologies used
* NodeJS
* Express
* MySQL
* Redis
* AsyncJS

### Database Setup
* Use `db_migrations/schema.sql` to dump the data into MySQL database.

### Running the application in development environment
* Run `npm run dev` to start the application. App will run on http://localhost:3000.

### APIs
## Inbound SMS
``
curl -X POST \
  http://localhost:3000/inbound/sms \
  -H 'Authorization: Basic YXpyMToyMFMwS1BOT0lN' \
  -H 'Content-Type: application/json' \
  -H 'Host: localhost:3000' \
  -d '{
	"from": "321124",
	"to": "4924195509198",
	"text": "STOP"
}'
``
## Outbound SMS
``
curl -X POST \
  http://localhost:3000/outbound/sms \
  -H 'Authorization: Basic YXpyMToyMFMwS1BOT0lN' \
  -H 'Content-Type: application/json' \
  -H 'Host: localhost:3000' \
  -d '{
	"from": "321124",
	"to": "4924195509198",
	"text": "message"
}'
``
