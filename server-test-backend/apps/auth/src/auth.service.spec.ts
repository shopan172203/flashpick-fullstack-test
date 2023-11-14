// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthService } from './auth.service';
// import { PrismaService } from '@app/common';
// import { ConflictException } from '@nestjs/common';
// import * as bcrypt from 'bcryptjs';
// import * as jsonwebtoken from 'jsonwebtoken';

// describe('AuthService', () => {
//   let authService: AuthService;
//   let prismaService: PrismaService;

//   beforeEach(async () => {
//     prismaService = new PrismaService(); // Create a new instance of PrismaService
//     authService = new AuthService(prismaService); // Inject the instance into AuthService

//     jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

//     // Mock the create function with a user object that matches the Prisma entity structure
//     jest.spyOn(prismaService.user, 'create').mockResolvedValue({
//       id: 1,
//       name: 'John Doe',
//       email: 'johndoe@example.com',
//       password: 'hashedPassword',
//       created_at: new Date(),
//       updated_at: new Date(),
//     });

//     // Mock the bcrypt.hash function
//     jest
//       .spyOn(bcrypt, 'hash')
//       .mockImplementation(async (password: string, saltOrRounds: number) => {
//         // Mock the bcrypt.hash function with an asynchronous function
//         return 'hashedPassword';
//       });

//     // Mock the jwt token

//     jest.spyOn(authService, 'generateJWT').mockReturnValue('mocked-jwt-token');
//   });

//   it('should be defined', () => {
//     expect(authService).toBeDefined();
//   });

//   describe('signup', () => {
//     it('should create a new user', async () => {
//       // Arrange
//       const signupParams = {
//         name: 'John Doe',
//         email: 'johndoe@example.com',
//         password: 'password123',
//       };

//       // Act
//       const result = await authService.signUp(signupParams);

//       // Assert
//       expect(result).toBe('mocked-jwt-token');

//       expect(prismaService.user.findUnique).toHaveBeenCalledWith({
//         where: {
//           email: signupParams.email,
//         },
//       });

//       expect(bcrypt.hash).toHaveBeenCalledWith(signupParams.password, 10);

//       expect(prismaService.user.create).toHaveBeenCalledWith({
//         data: {
//           name: signupParams.name,
//           email: signupParams.email,
//           password: 'hashedPassword', // The mocked bcrypt hash result
//         },
//       });
//     });

//     it('should throw ConflictException if user already exists', async () => {
//       // Arrange
//       const signupParams = {
//         name: 'John Doe',
//         email: 'johndoe@example.com',
//         password: 'password123',
//       };

//       jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
//         id: 1,
//         name: 'Existing User',
//         email: 'johndoe@example.com',
//         password: 'hashedPassword',
//         created_at: new Date(),
//         updated_at: new Date(),
//       });

//       // Act and Assert
//       await expect(authService.signUp(signupParams)).rejects.toThrow(
//         ConflictException
//       );
//     });
//   });
// });

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@app/common';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    }).compile();

    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation(async (password: string, saltOrRounds: number) => {
        // Mock the bcrypt.hash function with an asynchronous function
        return 'hashedPassword';
      });

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signUp', () => {
    it('should create a new user when the email is not in use', async () => {
      // Mock the PrismaService user.findUnique to return null, indicating the email is not in use.
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      const signupParams = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock the PrismaService user.create to return a user.
      prismaService.user.create = jest.fn().mockResolvedValue({
        id: 1,
        ...signupParams,
      });

      const result = await authService.signUp(signupParams);

      expect(result).toBeDefined();

      expect(jwt.verify(result, process.env.JSON_TOKEN_KEY)).toBeDefined();
    });

    it('should hash the password before storing it in the database', async () => {
      // jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword',10);

      // await authService.signUp({
      //   name: 'John Doe',
      //   email: 'johndoe@example.com',
      //   password: 'password123',
      // });

      const signupParams = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      expect(bcrypt.hash).toHaveBeenCalledWith(signupParams.password, 10);
    });

    it('should throw a ConflictException when the email is already in use', async () => {
      // Mock the PrismaService user.findUnique to return an existing user.
      prismaService.user.findUnique = jest.fn().mockResolvedValue({});

      const signupParams = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      try {
        await authService.signUp(signupParams);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
      }
    });
  });
});
