import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RateLimitCleanupService } from './rateLimitCleanUp.service';
import { HttpExeptionFilter } from './common/filterexeption/http-filter-exeption';
import { UserModule } from './user/user.module';
import { ConfigModule } from './config/config.module';
import { NetworkruleModule } from './networkrule/networkrule.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'client'),
      // exclude: ['api/{*}', 'docs/{*}'],
      exclude: ['/api/{*test}', '/docs/{*test}'],
      serveStaticOptions: { fallthrough: false },
    }),
    PrismaModule,
    AuthModule,
    ScheduleModule.forRoot(),
    UserModule,
    ConfigModule,
    NetworkruleModule,
    AttendanceModule,
  ],
  providers: [
    {
      provide: 'APP_FILTER',
      useClass: HttpExeptionFilter,
    },
    RateLimitCleanupService,
  ],
})
export class AppModule {}
