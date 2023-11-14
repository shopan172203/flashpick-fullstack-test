import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

interface SignupParams {
  name: string;
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signUp({ name, email, password }: SignupParams) {
    const userExists = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (userExists) {
      throw new ConflictException();
      // return 'Username or email already exists';
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // return 'user created';
    return this.generateJWT(name, user.id);
  }

  private generateJWT(name: string, id: string) {
    return jwt.sign(
      {
        name,
        id,
      },
      process.env.JSON_TOKEN_KEY,
      {
        expiresIn: 3600000,
      }
    );
  }
}
