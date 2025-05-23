import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class RateLimitCleanupService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_8_HOURS)
  async cleanRevokeTokens() {
    await this.prisma.revokedToken.deleteMany({});
  }
}
