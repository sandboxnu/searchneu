# Notifications

?> Note: The **Notifications** documentation from our [backend docs](https://sandboxnu.github.io/course-catalog-api/) has additional details (and setup instructions)

## End-to-End Signup Flow

- User searches for a class, clicks button on search result to sign up for SMS notifications
- User enters phone # in modal, clicks button to send verification code
  - This sends a `POST` request to the backend containing the phone #
  - The backend calls the Twilio API to send a verification code to the provided phone #
- User receives a text with a code
- User types code into modal, clicks button to verify
  - This sends a `POST` request to the backend containing the phone # and code
  - The backend calls the Twilio API to check whether the code was correct
    - If correct, the backend signs a JSON Web Token (JWT) that contains the phone # and sends it back to the frontend
      - The backend also inserts a new record in Postgres with an autogenerated userId if that phone # did not previously exist
- The frontend receives the JWT and stores it in the browser
- Any time the search results page is rendered the frontend tries to fetch the user's info
  - Frontend checks whether the JWT exists, if it does then it sends a `GET` request to the backend asking for the course/section subscriptions for that user
    - Using JWTs allows the backend to sign the JWT with a secret when it creates it, and when it receives it later it can verify with that same secret that the payload was not modified (the payload is just the phone # in this case)
  - If the user info does exist, then it is passed in to the header component to render the user's phone # and passed to the search results to correctly toggle sections/courses that the user has already signed up for
- Now the user can see the notification toggles
- User clicks on a toggle, it sends a `PUT` or `DELETE` to the backend depending on whether they are subscribing or unsubscribing
- The backend receives the request containing the course/section hash and the phone #
  - First the backend verifies the JWT
  - Then the backend inserts (for `PUT`s) or deletes (for `DELETE`s) a record in the database that maps the userId associated with that phone # and the course/section hash
- The user can log out at any time by clicking on the button on the header, which will delete the JWT from the browser

## Environment Variables

- Backend:
  - TWILIO_ACCOUNT_SID
  - TWILIO_AUTH_TOKEN
  - TWILIO_PHONE_NUMBER
  - TWILIO_VERIFY_SERVICE_ID
  - CLIENT_ORIGIN
  - JWT_SECRET
- Frontend:
  - NEXT_PUBLIC_NOTIFS_ENDPOINT

## TODOs

- Allow the user to text "STATUS" to see all their current subscriptions
  - This requires configuring an SMS webhook on Twilio (https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply-node-js)
  - For local development you can use ngrok (https://ngrok.com/download) to create a public URL that will forward to your local
    - e.g. `ngrok http 8080` and then paste the generated URL in the Twilio configuration so that incoming texts get forwarded to your local
- Allow the user to text "STOP ALL" to delete all their subscriptions
- Add a default message to every text explaining available commands (e.g. "Text HELP to see commands", texting HELP responds with explanations for "STATUS", "STOP ALL", etc.)
- Change notif toggle to flip BEFORE sending network request to reduce lag, display success banner when req finishes or display error banner (and un-toggle) if fails
- Allow a user to see their current subscriptions on the frontend
