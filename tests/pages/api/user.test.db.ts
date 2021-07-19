import { User } from '@prisma/client';
import { NextApiHandler } from 'next';
import * as UserHandler from '../../../pages/api/user';
import { signLoginToken } from '../../../utils/api/jwt';
import { prisma } from '../../../utils/api/prisma';
import {
  it404sOnInvalidHTTPMethods,
  testHandlerFactory,
} from './utils/dbTestUtils';

jest.mock('jsonwebtoken');

let mockUser: User;
const userHandler: NextApiHandler = UserHandler.default;
const [testUserHandler, testUserHandlerAsUser] =
  testHandlerFactory(userHandler);

describe('/api/user', () => {
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

  it404sOnInvalidHTTPMethods(userHandler, ['GET']);

  describe('GET', () => {
    it('gets a user with the id given', async () => {
      await testUserHandlerAsUser(
        { method: 'GET', userId: mockUser.id },
        async (response) => {
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.followedCourses).toEqual(['neu.edu/202130/CS/4500']);
          expect(data.followedSections).toEqual([
            'neu.edu/202130/CS/4500/12345',
            'neu.edu/202130/CS/4500/23456',
          ]);
        }
      );
    });

    it("attempts to get a user that doesn't exist", async () => {
      await testUserHandlerAsUser(
        { method: 'GET', userId: mockUser.id + 100000000 },
        async (response) => expect(response.status).toBe(401)
      );
    });
  });

  describe('withUser', () => {
    it('garbage in garbage out for the user endpoint', async () => {
      await testUserHandler(async ({ fetch }) => {
        const response = await fetch({
          headers: {
            cookie: 'authToken={ "userId": "HOLLA HOLLA" }',
          },
        });
        expect(response.status).toBe(401);

        const response2 = await fetch({
          headers: { cookie: 'wakanda=forever' },
        });
        expect(response2.status).toBe(401);

        const response3 = await fetch({});
        expect(response3.status).toBe(401);

        const response4 = await fetch({
          headers: {
            cookie: 'authToken={jid{}',
          },
        });
        expect(response4.status).toBe(401);
      });
    });

    it('fails if given login token instead of auth token', async () => {
      await testUserHandler(async ({ fetch }) => {
        const response = await fetch({
          headers: {
            cookie: 'authToken=' + (await signLoginToken(mockUser.id)),
          },
        });
        expect(response.status).toBe(401);
      });
    });
  });
});
