import { NextApiRequest, NextApiResponse } from 'next';
import {
  LoginTokenPayload,
  MessengerTokenPayload,
  signAsync,
} from '../../../utils/api/jwt';
import { prisma } from '../../../utils/api/prisma';

export interface GetMessengerTokenResponse {
  messengerToken: string;
  loginToken: string;
}

/**
 * ========================= GET /api/user/messenger_token =======================
 * Begin a facebook login session by getting a LoginToken and MessengerToken
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === 'GET') {
    const fbSession = await prisma.facebookLoginSessions.create({ data: {} });
    const messengerToken: MessengerTokenPayload = {
      messenger: true,
      fbSessionId: fbSession.id,
    };
    const loginToken: LoginTokenPayload = {
      login: true,
      fbSessionId: fbSession.id,
    };
    const data: GetMessengerTokenResponse = {
      messengerToken: await signAsync(messengerToken),
      loginToken: await signAsync(loginToken),
    };
    res.json(data);
    return;
  }
  res.status(404).end();
}