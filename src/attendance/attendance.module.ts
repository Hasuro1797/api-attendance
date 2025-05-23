import { Module } from '@nestjs/common';
import { ConfigModule } from 'src/config/config.module';
import { UserModule } from 'src/user/user.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [ConfigModule, UserModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
