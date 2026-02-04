"use server";

export async function sendFeedbackToSlack(
  typeOfFeedback: string,
  message: string,
  contact: string,
  url: string,
) {
  const endPointUrl = process.env.SLACK_WEBHOOK_URL;
  if (!endPointUrl) {
    return;
  }
  const parsed_contact = contact === "" ? "No email provided" : contact;

  const text = {
    type: "mrkdwn",
    text: `Someone submitted some feedback:\n> *Feedback Type*: ${typeOfFeedback} \n> *Contact*: \`${parsed_contact}\` \n> *Message*: ${message}\n> *URL*: ${url}`,
  };
  const data = {
    text: "Someone submitted some feedback",
    blocks: [
      {
        type: "section",
        text,
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
  return response.status;
}
