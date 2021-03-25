import axios from 'axios';
import macros from '../../components/macros';

const MESSAGE_TAG = 'CONFIRMED_EVENT_UPDATE';

export default async function sendFBMessage(
  fbSenderId: string,
  text: string
): Promise<void> {
  const token = process.env.FB_ACCESS_TOKEN;

  console.log('tryna send message with token', token);
  const response = await axios.post(
    'https://graph.facebook.com/v2.6/me/messages',
    {
      recipient: {
        id: fbSenderId,
      },
      message: {
        text,
      },
      tag: MESSAGE_TAG,
    },
    {
      params: {
        access_token: token,
      },
    }
  );

  if (response?.data?.message_id) {
    macros.log(
      'Sent a fb message to ',
      fbSenderId,
      text,
      response.data.message_id
    );
    return;
  } else {
    macros.error('Could not send fb message', fbSenderId, text, response.data);
  }
}
