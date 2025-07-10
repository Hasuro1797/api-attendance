import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Modality, Roles } from 'src/common/enums/roles.enum';
import { UnauthorizedMessages } from 'src/common/types/errorTypes';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { SignInDto } from './dto/signin.dto';
import { JwtPayload } from './types';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(signInDto: SignInDto, clientip: string) {
    const user = await this.validateUser(
      signInDto.email,
      signInDto.password,
      clientip,
    );
    if (!user)
      throw new UnauthorizedException(UnauthorizedMessages.INVALID_CREDENTIALS);

    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      modality: user.modality,
    };

    const accessToken = await this.generateToken(payload);
    const updatedUser = await this.userService.updateOnlineStatus(
      user.id,
      true,
    );
    return {
      name: updatedUser.name,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      modality: updatedUser.modality,
      online: updatedUser.online,
      accessToken,
    };
  }

  async signup(signupDto: CreateUserDto) {
    const count = await this.prisma.user.count();
    if (count !== 0) {
      throw new BadRequestException('Ya existe un administrador registrado');
    }
    const { password, ...rest } = signupDto;
    const hashedPassword = await this.userService.hashPassword(password);
    const user = await this.prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        role: Roles.ADMIN,
      },
    });
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: Roles.ADMIN,
      modality: user.modality as Modality,
    };
    const accessToken = await this.generateToken(payload);
    const updatedUser = await this.userService.updateOnlineStatus(
      user.id,
      true,
    );
    return {
      name: updatedUser.name,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      modality: updatedUser.modality,
      online: updatedUser.online,
      accessToken,
    };
  }

  async signOut(accessToken: string, userId: string) {
    await this.prisma.revokedToken.create({
      data: {
        token: accessToken,
      },
    });
    await this.userService.updateOnlineStatus(userId, false);
    return {
      message: 'Sesión cerrada exitosamente',
    };
  }

  async validateUser(
    username: string,
    pass: string,
    ip: string,
  ): Promise<User> {
    //Valid user exists
    const user = await this.userService.findUserByEmail(username);
    if (!user) return null;
    const { password, ...userInfo } = user;

    //Valid password
    const isMatch = await this.userService.comparePassword(pass, password);
    if (!isMatch) return null;
    console.log('la ip es', ip);
    //Valid ip
    const ipAllowed = await this.userService.ipAllowed(ip);
    console.log('la ip permitida es', ipAllowed);
    //id ip allowed
    if (!ipAllowed) return null;

    //Valid modality
    if (ipAllowed.modality !== user.modality) {
      return null;
    }

    return {
      ...userInfo,
      role: userInfo.role as Roles,
      modality: userInfo.modality as Modality,
    };
  }

  async generateToken(payload: JwtPayload) {
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '1hr',
    });
    return token;
  }

  async getProfile(userId: string) {
    const user = await this.userService.findOne(userId);
    return user;
  }
}
