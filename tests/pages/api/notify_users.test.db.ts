import { NextApiHandler } from 'next';
import { mocked } from 'ts-jest/utils';
import * as httpSignature from 'http-signature';
import * as NotifyUsersHandler from '../../../pages/api/notify_users';
import sendFBMessage from '../../../utils/api/notifyer';
import { prisma } from '../../../utils/api/prisma';
import {
  it404sOnInvalidHTTPMethods,
  testHandlerFactory,
} from './utils/dbTestUtils';

jest.mock('../../../utils/api/notifyer');
const notifyUsersHandler: NextApiHandler = NotifyUsersHandler.default;
const [testNotifyUsersHandler, _] = testHandlerFactory(notifyUsersHandler);

// TODO: some form of mocking to make sure that we're validating we're getting info from course catalog (whenever mitch finishes that)
// TODO: edge cases edge cases edge cases

describe('/api/notify_users', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    httpSignature.parseRequest = jest.fn();
    httpSignature.verifySignature = jest.fn().mockReturnValue(true);
    await prisma.followedSection.deleteMany({});
    await prisma.followedCourse.deleteMany({});
    await prisma.user.deleteMany({});

    await prisma.user.create({
      data: {
        fbMessengerId: '0000000000',
        firstName: 'Eddy',
        lastName: 'Li',
        followedCourses: { create: [{ courseHash: 'neu.edu/202130/CS/4500' }] },
        followedSections: {
          create: [
            {
              sectionHash: 'neu.edu/202130/CS/4500/12345',
            },
            {
              sectionHash: 'neu.edu/202130/CS/4500/23456',
            },
          ],
        },
      },
    });

    await prisma.user.create({
      data: {
        fbMessengerId: '111111111',
        firstName: 'Da-Jin',
        lastName: 'Chu',
        followedCourses: {
          create: [
            { courseHash: 'neu.edu/202130/CS/2500' },
            { courseHash: 'neu.edu/202030/CS/3650' },
          ],
        },
        followedSections: {
          create: [
            {
              sectionHash: 'neu.edu/202130/CS/2500/12345',
            },
            {
              sectionHash: 'neu.edu/202030/CS/3650/23456',
            },
          ],
        },
      },
    });

    await prisma.user.create({
      data: {
        fbMessengerId: '2222222222',
        firstName: 'Mitchell',
        lastName: 'Gamburg',
        followedCourses: {
          create: [{ courseHash: 'neu.edu/202130/CS/4500' }],
        },
      },
    });

    mocked(sendFBMessage).mockResolvedValue();
  });

  it404sOnInvalidHTTPMethods(notifyUsersHandler, ['POST']);

  it("Doesn't send a notification if request authorization is incorrect", async () => {
    httpSignature.verifySignature = jest.fn().mockReturnValue(false);
    await testNotifyUsersHandler(async ({ fetch }) => {
      const response = await fetch({
        method: 'POST',
        body: JSON.stringify({
          updatedCourses: [
            {
              courseId: '3650',
              subject: 'CS',
              termId: '202130',
              numberOfSectionsAdded: 1,
              campus: 'NEU',
              courseHash: 'neu.edu/202130/CS/3650',
            },
          ],
          updatedSections: [],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);

      expect(mocked(sendFBMessage).mock.calls.length).toEqual(0);
    });
  });

  it("Doesn't send a notification if request cannot be parsed by httpSignature", async () => {
    httpSignature.parseRequest = jest.fn().mockImplementation(() => {
      throw new Error('mock unable to parse request');
    });
    await testNotifyUsersHandler(async ({ fetch }) => {
      const response = await fetch({
        method: 'POST',
        body: JSON.stringify({
          updatedCourses: [
            {
              courseId: '3650',
              subject: 'CS',
              termId: '202130',
              numberOfSectionsAdded: 1,
              campus: 'NEU',
              courseHash: 'neu.edu/202130/CS/3650',
            },
          ],
          updatedSections: [],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);

      expect(mocked(sendFBMessage).mock.calls.length).toEqual(0);
    });
  });

  it("Doesn't send a notification if request cannot be verified by httpSignature", async () => {
    httpSignature.verifySignature = jest.fn().mockImplementation(() => {
      throw new Error('mock unable to verify signature');
    });
    await testNotifyUsersHandler(async ({ fetch }) => {
      const response = await fetch({
        method: 'POST',
        body: JSON.stringify({
          updatedCourses: [
            {
              courseId: '3650',
              subject: 'CS',
              termId: '202130',
              numberOfSectionsAdded: 1,
              campus: 'NEU',
              courseHash: 'neu.edu/202130/CS/3650',
            },
          ],
          updatedSections: [],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);

      expect(mocked(sendFBMessage).mock.calls.length).toEqual(0);
    });
  });

  it('sends messages to everyone subscribed to CS 4500', async () => {
    await testNotifyUsersHandler(async ({ fetch }) => {
      const response = await fetch({
        method: 'POST',
        body: JSON.stringify({
          updatedCourses: [
            {
              courseId: '4500',
              subject: 'CS',
              termId: '202130',
              numberOfSectionsAdded: 1,
              campus: 'NEU',
              courseHash: 'neu.edu/202130/CS/4500',
            },
          ],
          updatedSections: [
            {
              termId: '202130',
              crn: '12345',
              seatsRemaining: 2,
              campus: 'NEU',
              sectionHash: 'neu.edu/202130/CS/4500/12345',
              subject: 'CS',
              courseId: '4500',
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      expect(mocked(sendFBMessage).mock.calls).toEqual([
        [
          '0000000000',
          'A section was added to CS 4500! Check it out at https://searchneu.com/NEU/202130/search/CS4500 !',
        ],
        [
          '2222222222',
          'A section was added to CS 4500! Check it out at https://searchneu.com/NEU/202130/search/CS4500 !',
        ],
        [
          '0000000000',
          'A seat opened up in CS 4500 (CRN: 12345). Check it out at https://searchneu.com/NEU/202130/search/CS4500 !',
        ],
      ]);
    });
  });

  it("Doesn't send a notification for the wrong term", async () => {
    await testNotifyUsersHandler(async ({ fetch }) => {
      const response = await fetch({
        method: 'POST',
        body: JSON.stringify({
          updatedCourses: [
            {
              courseId: '3650',
              subject: 'CS',
              termId: '202130',
              numberOfSectionsAdded: 1,
              campus: 'NEU',
              courseHash: 'neu.edu/202130/CS/3650',
            },
          ],
          updatedSections: [],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      expect(mocked(sendFBMessage).mock.calls.length).toEqual(0);
    });
  });

  it('Requires both updatedCourses and updatedSections to be defined', async () => {
    await testNotifyUsersHandler(async ({ fetch }) => {
      const response = await fetch({
        method: 'POST',
        body: JSON.stringify({
          updatedSections: [],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual([
        {
          target: { updatedSections: [] },
          property: 'updatedCourses',
          children: [],
          constraints: {
            isDefined: 'updatedCourses should not be null or undefined',
          },
        },
      ]);
    });
  });

  it("doesn't crash on literally not JSON", async () => {
    await testNotifyUsersHandler(async ({ fetch }) => {
      const response = await fetch({
        method: 'POST',
        body: '{{{{{{',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(400);
      expect(await response.text()).toEqual('Invalid JSON');
    });
  });
});
