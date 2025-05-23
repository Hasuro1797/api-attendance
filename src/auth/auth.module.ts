import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { envs } from 'config';
import { AccessTokenStrategy } from './strategies/accesstoken.strategy';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: envs.jwtSecret,
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy],
})
export class AuthModule {}
