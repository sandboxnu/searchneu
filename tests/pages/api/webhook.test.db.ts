import { FacebookLoginSessions } from '@prisma/client';
import axios from 'axios';
import { NextApiHandler } from 'next';
import { mocked } from 'ts-jest/utils';
import * as WebhookHandler from '../../../pages/api/webhook';
import { signLoginToken, signMessengerToken } from '../../../utils/api/jwt';
import { prisma } from '../../../utils/api/prisma';
import {
  it404sOnInvalidHTTPMethods,
  testHandlerFactory,
} from './utils/dbTestUtils';

jest.mock('axios');
jest.mock('jsonwebtoken');
const webhookHandler: NextApiHandler = WebhookHandler.default;
const [testWebhookHandler, testWebhookHandlerAsUser] =
  testHandlerFactory(webhookHandler);

describe('/api/webhook', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await prisma.followedSection.deleteMany({});
    await prisma.followedCourse.deleteMany({});
    await prisma.user.deleteMany({});
    mocked(axios.get).mockResolvedValue({
      data: {
        first_name: 'Jorge',
        last_name: 'Beans',
      },
    });
    mocked(axios.post).mockResolvedValue({
      data: {
        message_id: '69420',
      },
    });
  });

  it404sOnInvalidHTTPMethods(webhookHandler, ['GET', 'POST']);

  describe('private methods', () => {
    const {
      handleMessengerButtonClick,
      createNewUser,
      handleMessage,
      unsubscribeSender,
    } = WebhookHandler._private;

    describe('handleMessengerButtonClick', () => {
      let session: FacebookLoginSessions;
      beforeEach(async () => {
        session = await prisma.facebookLoginSessions.create({ data: {} });
      });

      it('creates a user on messenger button click when there is none initially', async () => {
        expect(
          await prisma.user.count({
            where: {
              fbMessengerId: '12345',
            },
          })
        ).toBe(0);

        await handleMessengerButtonClick({
          sender: { id: '12345' },
          optin: {
            ref: await signMessengerToken(session.id),
          },
        });

        const user = await prisma.user.findUnique({
          where: {
            fbMessengerId: '12345',
          },
          include: { FacebookLoginSessions: true },
        });
        expect(user).toMatchObject({
          firstName: 'Jorge',
          lastName: 'Beans',
          FacebookLoginSessions: [{ id: session.id, userId: user.id }],
        });
      });

      it('associates login session with existing user', async () => {
        const user = await prisma.user.create({
          data: { fbMessengerId: '12345' },
        });

        await handleMessengerButtonClick({
          sender: { id: '12345' },
          optin: {
            ref: await signMessengerToken(session.id),
          },
        });
        session = await prisma.facebookLoginSessions.findUnique({
          where: { id: session.id },
        });
        expect(session.userId).toBe(user.id);
      });

      it('does nothing if session id does not exist', async () => {
        await handleMessengerButtonClick({
          sender: { id: '12345' },
          optin: { ref: await signMessengerToken(session.id + 1000) },
        });
        session = await prisma.facebookLoginSessions.findUnique({
          where: { id: session.id },
        });
        expect(session.userId).toBeNull();
      });

      it('does nothing if given a logintoken instead of messengertoken', async () => {
        await handleMessengerButtonClick({
          sender: { id: '12345' },
          optin: {
            ref: await signLoginToken(session.id),
          },
        });
        session = await prisma.facebookLoginSessions.findUnique({
          where: { id: session.id },
        });
        expect(session.userId).toBeNull();
      });
    });

    describe('createNewUser', () => {
      it('creates user with id', async () => {
        await createNewUser('12345');

        const user = await prisma.user.findUnique({
          where: {
            fbMessengerId: '12345',
          },
        });
        expect(user.firstName).toBe('Jorge');
        expect(user.lastName).toBe('Beans');
        expect(mocked(axios.get).mock.calls[0][0]).toBe(
          'https://graph.facebook.com/v2.6/12345'
        );
      });
    });

    describe('handleMessage', () => {
      beforeEach(async () => {
        await prisma.user.create({
          data: {
            firstName: 'Jorge',
            lastName: 'Beans',
            fbMessengerId: '12345',
          },
        });
      });

      it("responds to a message from a user that doesn't exist in the db", async () => {
        await handleMessage({
          sender: { id: '23456' },
          message: {
            text: 'test',
          },
        });
        const mockCallParams = mocked(axios.post).mock.calls[0];
        expect(
          mockCallParams[1].message.text ===
            "Yo! 👋😃😆 I'm the Search NEU bot. I will notify you when seats open up in classes that are full. Sign up on https://searchneu.com!"
        );
      });

      it('responds to test message from a  user who exists', async () => {
        await handleMessage({
          sender: { id: '12345' },
          message: {
            text: 'test',
          },
        });
        const mockCallParams = mocked(axios.post).mock.calls[0];
        expect(
          mockCallParams[1].message.text ===
            'CS 1800 now has 1 seat available!! Check it out on https://searchneu.com/cs1800 !'
        );
      });

      it('responds to no u', async () => {
        const noYous = ['no u', 'no you', 'nou', 'noyou'];

        for (const text of noYous) {
          await handleMessage({
            sender: { id: '12345' },
            message: {
              text,
            },
          });
        }

        expect(mocked(axios.post).mock.calls.length).toBe(4);
        mocked(axios.post).mock.calls.forEach((call) => {
          expect(call[1].message.text).toBe('no u');
        });
      });

      it('responds to stop and unsubscribes from classes', async () => {
        const initUser = await prisma.user.findFirst({
          where: {
            fbMessengerId: '12345',
          },
        });

        await prisma.followedCourse.create({
          data: {
            courseHash: 'neu.edu/202130/CS/4500',
            user: { connect: { id: initUser.id } },
          },
        });

        await prisma.followedSection.create({
          data: {
            sectionHash: 'neu.edu/202130/CS/4500/12345',
            user: { connect: { id: initUser.id } },
          },
        });

        await prisma.followedSection.create({
          data: {
            sectionHash: 'neu.edu/202130/CS/4500/23456',
            user: { connect: { id: initUser.id } },
          },
        });

        await handleMessage({
          sender: { id: '12345' },
          message: {
            text: 'stop',
          },
        });

        expect(mocked(axios.post).mock.calls[0][1].message.text).toBe(
          "You've been unsubscribed from everything! Free free to re-subscribe to updates on https://searchneu.com"
        );

        const user = await prisma.user.findFirst({
          where: {
            fbMessengerId: '12345',
          },
          include: { followedCourses: true, followedSections: true },
        });

        expect(user.followedCourses).toStrictEqual([]);
        expect(user.followedSections).toStrictEqual([]);
      });
    });

    describe('unsubscribeSender', () => {
      beforeEach(async () => {
        await prisma.user.create({
          data: {
            firstName: 'Jorge',
            lastName: 'Beans',
            fbMessengerId: '12345',
          },
        });
      });

      it("doesn't break on user with nothing followed", async () => {
        await unsubscribeSender('12345');

        expect(mocked(axios.post).mock.calls[0][1].message.text).toBe(
          "You've been unsubscribed from everything! Free free to re-subscribe to updates on https://searchneu.com"
        );

        const user = await prisma.user.findFirst({
          where: {
            fbMessengerId: '12345',
          },
          include: { followedCourses: true, followedSections: true },
        });

        expect(user.followedCourses).toStrictEqual([]);
        expect(user.followedSections).toStrictEqual([]);
      });
      it('unfollows all things followed', async () => {
        const initUser = await prisma.user.findFirst({
          where: {
            fbMessengerId: '12345',
          },
        });

        await prisma.followedCourse.create({
          data: {
            courseHash: 'neu.edu/202130/CS/4500',
            user: { connect: { id: initUser.id } },
          },
        });

        await prisma.followedSection.create({
          data: {
            sectionHash: 'neu.edu/202130/CS/4500/12345',
            user: { connect: { id: initUser.id } },
          },
        });

        await prisma.followedSection.create({
          data: {
            sectionHash: 'neu.edu/202130/CS/4500/23456',
            user: { connect: { id: initUser.id } },
          },
        });

        await unsubscribeSender('12345');

        expect(mocked(axios.post).mock.calls[0][1].message.text).toBe(
          "You've been unsubscribed from everything! Free free to re-subscribe to updates on https://searchneu.com"
        );

        const user = await prisma.user.findFirst({
          where: {
            fbMessengerId: '12345',
          },
          include: { followedCourses: true, followedSections: true },
        });

        expect(user.followedCourses).toStrictEqual([]);
        expect(user.followedSections).toStrictEqual([]);
      });
    });
  });
});
