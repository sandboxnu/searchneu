import { User } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import 'reflect-metadata';
import { verifyMessengerToken } from '../../utils/api/jwt';
import sendFBMessage from '../../utils/api/notifyer';
import { prisma } from '../../utils/api/prisma';

/**
 *
 * To setup for local testing, you need to do the following:
 *
 * Make sure you have a Facebook developer account -- you can create one at
 * https://developers.facebook.com/
 *
 * Then, make sure you create a page, and an app.
 * After you create these, set NEXT_PUBLIC_FB_PAGE_ID="<your fb's page id here>"
 * and NEXT_PUBLIC_FB_APP_ID="<your fb's app id here>"
 * Make sure that the ID's are in double quotes!
 *
 * Next go to the left sidebar, and go to the page under > Products > Messenger.
 *
 * Then, under "Access Tokens", there should be a row with your page's name and
 * the button "Generate Token." Click that, and then copy paste the token into
 * .env.local under FB_ACCESS_TOKEN=<your access token>
 * note that there are NO quotation marks around this.
 *
 * Next you'll need your app secret. Navigate to > App Settings > Basic.
 * There's a field titled "App Secret." Copy that into FB_APP_SECRET
 * again without quotation marks.
 *
 * Afterwards, return to the page under > Products > Messenger. Install
 * [ngrok](https://ngrok.com/) and have it running, listening to port
 * 5000 (or wherever you're running Search on). The command to type
 * would be "ngrok http 5000". Afterwards, there should be a row
 * labeled "Forwarding" with an https address. Take that, and copy
 * it into where it says "Callback URL" under Webhooks, but set it to
 * <ngrokURL>/api/webhook. Then set Verify Token to be "hello"
 * (this is set in .env.development under FB_VERIFY_TOKEN).
 * FB should send you a GET request.
 *
 * Finally you're here, there should be a button on this page in the Webhooks
 * section that says "Add Subscriptions." Hit it, and then enable
 * "messages" and "messaging_optins."
 *
 * Then you should be good! Send "test" or "no u" to the Facebook Messenger
 * bot on your Facebook page and you should be set!
 *
 * Remember, in dev, messages will *only* be sent to admins of your page
 * (which currently means only you!). To give other devs access, you'll
 * have to do that through Facebook.
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'GET') {
    get(req, res);
  } else if (req.method === 'POST') {
    await post(req, res);
  } else {
    res.status(404).end();
  }
}

type FacebookEventsPost = {
  entry: FacebookEvent[];
};

type FacebookEvent = {
  messaging: MessagingEvent[];
};

type MessagingEvent = FBOptinEvent | FBMessageEvent;

/**
 * ========================= GET /api/webhook =======================
 * Let FB verify this endpoint (just once)
 * https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup/
 */
function get(req: NextApiRequest, res: NextApiResponse): void {
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).end();
    }
  }
  res.status(400).end();
}

/**
 * ========================= POST /api/webhook =======================
 * Handle facebook events from optin button and messenger texts
 */
async function post(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const [rawBody, body] = await parseBody(req);
  const isValid = isSignatureValid(
    rawBody,
    req.headers['x-hub-signature'] as string
  );

  // Keep this here for now
  console.log(JSON.stringify(body, null, 2), 'isValid: ', isValid);
  console.log(req.headers['x-hub-signature'] as string);
  if (isValid) {
    try {
      await Promise.all(
        body.entry[0].messaging.map(async (event) => {
          if (event.optin) {
            await handleMessengerButtonClick(event);
          } else if (event.message) {
            await handleMessage(event);
          }
        })
      );
    } finally {
      res.status(200).end();
    }
  } else {
    res.status(403).end();
  }
}

interface FBOptinEvent {
  sender: { id: string };
  optin: { ref: string };
}

// =============  Handle logging in via messenger button, turning login session into user  ============= //
async function handleMessengerButtonClick(event: FBOptinEvent): Promise<void> {
  // TODO: Validate userobject with class-validator
  const token = await verifyMessengerToken(event.optin.ref);
  if (!token) {
    return;
  }
  const session = await prisma.facebookLoginSessions.findUnique({
    where: { id: token.fbSessionId },
  });
  if (session) {
    const fbMessengerId = event.sender.id;
    //find or create user by fbmessengerid
    let user = await prisma.user.findUnique({
      where: { fbMessengerId },
    });
    if (!user) {
      //make new user
      user = await createNewUser(fbMessengerId);
      await sendFBMessage(
        fbMessengerId,
        `Yo! 👋😃😆 Thanks for signing up for notifications ${user.firstName}! `
      );
    }
    session.userId = user.id;
    await prisma.facebookLoginSessions.update({
      where: { id: session.id },
      data: { user: { connect: { id: user.id } } },
    });
  }
}

// Create new user from their fb messenger id
async function createNewUser(fbMessengerId: string): Promise<User> {
  const res = await axios.get(
    `https://graph.facebook.com/v2.6/${fbMessengerId}`,
    {
      params: {
        fields: 'first_name,last_name',
        access_token: process.env.FB_ACCESS_TOKEN,
      },
    }
  );
  return await prisma.user.create({
    data: {
      fbMessengerId,
      firstName: res.data.first_name,
      lastName: res.data.last_name,
    },
  });
}

interface FBMessageEvent {
  sender: { id: string };
  message: { text: string };
}

// =============  Handle a message sent by a user  ============= //
async function handleMessage(event: FBMessageEvent): Promise<void> {
  const text = event.message.text.toLowerCase();
  const senderId = event.sender.id;
  const doesUserExist = await prisma.user.count({
    where: {
      fbMessengerId: senderId,
    },
  });

  if (!doesUserExist) {
    await sendFBMessage(
      senderId,
      "Yo! 👋😃😆 I'm the Search NEU bot. I will notify you when seats open up in classes that are full. Sign up on https://searchneu.com!"
    );
    return;
  }

  if (text === 'test') {
    await sendFBMessage(
      senderId,
      'CS 1800 now has 1 seat available!! Check it out on https://searchneu.com/cs1800 !'
    );
  } else if (text === 'stop') {
    await unsubscribeSender(senderId);
  } else if (text === 'What is my facebook messenger sender id?') {
    await sendFBMessage(senderId, senderId);
  } else if (
    text === 'no u' ||
    text === 'no you' ||
    text === 'nou' ||
    text === 'noyou'
  ) {
    await sendFBMessage(senderId, 'no u');
  }
}

async function unsubscribeSender(senderId: string): Promise<void> {
  await prisma.user.update({
    where: {
      fbMessengerId: senderId,
    },
    data: {
      followedCourses: { deleteMany: {} },
      followedSections: { deleteMany: {} },
    },
  });

  await sendFBMessage(
    senderId,
    "You've been unsubscribed from everything! Free free to re-subscribe to updates on https://searchneu.com"
  );
}

// =============  Helpers to validate webhook is from Facebook  ============= //

// Given unparsed request, get the raw body buffer and the parsed request body
async function parseBody(
  req: NextApiRequest
): Promise<[string, Record<string, any>]> {
  return new Promise((resolve, reject) => {
    if (!req.body) {
      let buffer = '';
      req.on('data', (chunk) => {
        buffer += chunk;
      });

      req.on('end', () => {
        const body = JSON.parse(Buffer.from(buffer).toString());
        resolve([buffer, body]);
      });
      req.on('error', (e) => reject(e));
    }
  });
}

// Check if the checksum from the rawBody matches the signature given in the header
function isSignatureValid(rawBody: string, headerSignature: string): boolean {
  const calculatedSig =
    'sha1=' +
    crypto
      .createHmac('sha1', process.env.FB_APP_SECRET)
      .update(rawBody, 'utf-8')
      .digest('hex');
  const headerSig = headerSignature;
  return (
    headerSig &&
    headerSig.length === 45 &&
    headerSig.substr(0, 5) === 'sha1=' &&
    calculatedSig === headerSig
  );
}

// Disable body parser so that we can get the rawbody
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Mitch recommended th is for unit testing private functions.
 * Please don't use these in other modules
 */
export const _private = {
  handleMessengerButtonClick,
  createNewUser,
  handleMessage,
  unsubscribeSender,
};
