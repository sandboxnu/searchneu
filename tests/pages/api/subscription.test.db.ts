import { User } from '@prisma/client';
import { NextApiHandler } from 'next';
import * as SubscriptionHandler from '../../../pages/api/subscription';
import { prisma } from '../../../utils/api/prisma';
import { testHandlerFactory } from './dbTestUtils';

let mockUser: User;
const subscriptionHandler: NextApiHandler = SubscriptionHandler.default;
const [
  testSubscriptionHandler,
  testSubscriptionHandlerAsUser,
] = testHandlerFactory(subscriptionHandler);

beforeEach(async () => {
  await prisma.followedSection.deleteMany({});
  await prisma.followedCourse.deleteMany({});
  await prisma.user.deleteMany({});

  mockUser = await prisma.user.create({
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
});

describe('POST /api/subscription', () => {
  it('fails for nonexistent user', async () => {
    await testSubscriptionHandlerAsUser(
      {
        method: 'POST',
        body: {
          courseHash: 'neu.edu/202130/CS/2500',
        },
        userId: mockUser.id + 1000,
      },
      async (response) => {
        expect(response.status).toBe(401);

        const newUser = await prisma.user.findFirst({
          where: { id: mockUser.id + 1000 },
        });
        expect(newUser).toBeNull();
      }
    );
  });
  it('posts a course to follow', async () => {
    await testSubscriptionHandlerAsUser(
      {
        method: 'POST',
        body: {
          courseHash: 'neu.edu/202130/CS/2500',
        },
        userId: mockUser.id,
      },
      async (response) => {
        expect(response.status).toBe(201);

        const newUser = await prisma.user.findFirst({
          where: { id: mockUser.id },
          include: { followedCourses: true },
        });

        expect(newUser.followedCourses.length).toBe(2);
        expect(newUser.followedCourses).toContainEqual({
          courseHash: 'neu.edu/202130/CS/2500',
          userId: mockUser.id,
        });
      }
    );
  });

  it('posts a section to follow', async () => {
    await testSubscriptionHandlerAsUser(
      {
        method: 'POST',
        body: {
          sectionHash: 'neu.edu/202130/CS/2500/12393',
        },
        userId: mockUser.id,
      },
      async (response) => {
        expect(response.status).toBe(201);
        const newUser = await prisma.user.findFirst({
          where: { id: mockUser.id },
          include: { followedSections: true },
        });
        expect(newUser.followedSections.length).toBe(3);
        expect(newUser.followedSections).toContainEqual({
          sectionHash: 'neu.edu/202130/CS/2500/12393',
          userId: mockUser.id,
        });
      }
    );
  });

  it('still returns 201 when subscribing already-subscribed', async () => {
    await testSubscriptionHandlerAsUser(
      {
        method: 'POST',
        body: {
          sectionHash: 'neu.edu/202130/CS/4500/12345', // already subbed to this
        },
        userId: mockUser.id,
      },
      async (response) => {
        expect(response.status).toBe(201);
        const newUser = await prisma.user.findFirst({
          where: { id: mockUser.id },
          include: { followedSections: true },
        });
        expect(newUser.followedSections.length).toBe(2);
        expect(newUser.followedSections).toContainEqual({
          sectionHash: 'neu.edu/202130/CS/4500/12345',
          userId: mockUser.id,
        });
      }
    );
  });
});

describe('DELETE / api/subscription', () => {
  it('deletes a course from user', async () => {
    await testSubscriptionHandlerAsUser(
      {
        method: 'DELETE',
        body: {
          courseHash: 'neu.edu/202130/CS/4500',
        },
        userId: mockUser.id,
      },
      async (response) => {
        expect(response.status).toBe(200);
        const newUser = await prisma.user.findFirst({
          where: { id: mockUser.id },
          include: { followedCourses: true },
        });
        expect(newUser.followedCourses.length).toBe(0);
      }
    );
  });

  it('deletes a section from following', async () => {
    await testSubscriptionHandlerAsUser(
      {
        method: 'DELETE',
        body: {
          sectionHash: 'neu.edu/202130/CS/4500/12345',
        },
        userId: mockUser.id,
      },
      async (response) => {
        expect(response.status).toBe(200);
        const newUser = await prisma.user.findFirst({
          where: { id: mockUser.id },
          include: { followedSections: true },
        });
        expect(newUser.followedSections.length).toBe(1);
        expect(newUser.followedSections).toEqual([
          {
            sectionHash: 'neu.edu/202130/CS/4500/23456',
            userId: mockUser.id,
          },
        ]);
      }
    );
  });

  it('still returns 200 if unsubscribing a course that was never subscribed to begin with', async () => {
    await testSubscriptionHandlerAsUser(
      {
        method: 'DELETE',
        body: {
          courseHash: 'neu.edu/202130/MATH/1010',
        },
        userId: mockUser.id,
      },
      async (response) => {
        expect(response.status).toBe(200);
        const newUser = await prisma.user.findFirst({
          where: { id: mockUser.id },
          include: { followedCourses: true },
        });
        expect(newUser.followedCourses.length).toBe(1);
      }
    );
  });
});