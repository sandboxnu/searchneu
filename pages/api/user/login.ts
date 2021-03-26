import { NextApiRequest, NextApiResponse } from 'next';
import {
  AUTH_TOKEN_EXPIRATION_IN_SECONDS,
  signAuthToken,
  verifyLoginToken,
} from '../../../utils/api/jwt';
import { prisma } from '../../../utils/api/prisma';
import { serverRollbar } from '../../../utils/api/rollbar';
import setCookie from '../../../utils/api/setCookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'POST') {
    await post(req, res);
  } else {
    res.status(404).end();
  }
}

async function post(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const loginPayload = await verifyLoginToken(req.cookies.loginToken);

  if (!loginPayload) {
    res.status(401).end();
    return;
  }

  const loginSession = await prisma.facebookLoginSessions.findUnique({
    where: { id: loginPayload.fbSessionId },
  });
  if (!loginSession) {
    res.status(401).end();
    serverRollbar.error(
      'Invalid login session fbSessionId sent signed by valid JWT key -- is the key compromised?'
    );
    return;
  }
  if (!loginSession.userId) {
    res.status(400).send("Facebook validation hasn't come yet :aaaaaaaaaaaa:");
    return;
  }
  setCookie(res, 'authToken', await signAuthToken(loginSession.userId), {
    path: '/',
    maxAge: AUTH_TOKEN_EXPIRATION_IN_SECONDS * 1000,
  });
  res.status(200).end();
}
