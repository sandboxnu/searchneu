export async function sendFeedbackToSlack(message: string, contact: string) {
  const endPointUrl = process.env.SLACK_WEBHOOK_URL;
  if(!endPointUrl) {
    return 
  }
  const parsed_contact = contact === "" ? "No email provided" : contact;

  const data = {
    text: "Someone submitted some feedback",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Someone submitted some feedback:\n> *Contact*: \`${parsed_contact}\` \n> *Message*: ${message}`,
        },
      },
    ],
  };
  const parsed_data = JSON.stringify(data);

  const response = await fetch(endPointUrl, {
    method: "POST",
    body: parsed_data,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response;
}
