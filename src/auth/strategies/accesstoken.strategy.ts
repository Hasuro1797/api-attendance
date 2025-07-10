import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from '../types';
import { UnauthorizedMessages } from 'src/common/types/errorTypes';
import { envs } from 'config';
import { ipRange } from 'utils/ip.range';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: envs.jwtSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const isRevoked = await this.prisma.revokedToken.findUnique({
      where: {
        token: accessToken,
      },
    });
    if (isRevoked) {
      throw new UnauthorizedException(UnauthorizedMessages.INVALID_ACCESS);
    }

    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : (forwarded || '').split(',')[0];
    const rules = await this.prisma.netWorkRule.findMany();
    console.log('la ip del cliente es', ip);
    const matchRule = rules.find((rule) =>
      ipRange(
        ip.toString().trim() || req.socket.remoteAddress || '',
        rule.ipStart,
        rule.ipEnd,
      ),
    );
    console.log('la regla que coincide es', matchRule);

    if (!matchRule) {
      throw new UnauthorizedException(UnauthorizedMessages.INVALID_IP);
    }
    return { ...payload, accessToken };
  }
}
