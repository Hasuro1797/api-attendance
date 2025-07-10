import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { endOfDay, format, isBefore, set, startOfDay } from 'date-fns';
import { Status } from './common/enums/roles.enum';
import Holidays from 'date-holidays';

@Injectable()
export class RateLimitCleanupService {
  logger = new Logger(RateLimitCleanupService.name);
  constructor(private readonly prisma: PrismaService) {}

  holidays = new Holidays('PE');

  @Cron(CronExpression.EVERY_8_HOURS, { timeZone: 'America/Lima' })
  async cleanRevokeTokens() {
    await this.prisma.revokedToken.deleteMany({});
  }

  @Cron('0 */2 * * 1-5', { timeZone: 'America/Lima' })
  async checkAbsencesHourly() {
    const now = new Date();
    if (this.holidays.isHoliday(now)) {
      this.logger.log(
        `🎉 Hoy ${format(now, 'yyyy-MM-dd')} es feriado nacional en Perú. No se ejecuta la revisión.`,
      );
      return;
    }
    this.logger.log('⏰ Ejecutando revisión horaria de ausencias...');
    try {
      const config = await this.prisma.config.findFirst();
      if (!config) {
        this.logger.warn('❌ Configuración no encontrada.');
        return;
      }

      const [hour, minutes] = config.endTime.split(':').map(Number);
      const now = new Date();
      const cutoffTime = set(now, {
        hours: hour,
        minutes: minutes,
        seconds: 0,
        milliseconds: 0,
      });

      if (isBefore(now, cutoffTime)) {
        this.logger.log('⏳ Aún no ha pasado la hora de salida configurada.');
        return;
      }

      const alredyRan = await this.prisma.attendanceLog.findFirst({
        where: {
          executedAt: {
            gte: startOfDay(now),
            lte: endOfDay(now),
          },
        },
      });
      if (alredyRan) {
        this.logger.log('✅ Ya se ejecutó la revisión hoy.');
        return;
      }

      const { created, updated } = await this.registerAbsencesForDate(now);

      await this.prisma.attendanceLog.create({
        data: {
          created,
          updated,
          status: 'SUCESS',
        },
      });

      this.logger.log(
        `🎯 Finalizado. Creados: ${created}, Actualizados: ${updated}`,
      );
    } catch (error) {
      this.logger.error('💥 Error en revisión horaria', error);
      await this.prisma.attendanceLog.create({
        data: {
          created: 0,
          updated: 0,
          status: 'ERROR',
          error: error.message,
        },
      });
    }
  }

  private async registerAbsencesForDate(date: Date) {
    const start = startOfDay(date);
    const end = endOfDay(date);

    const users = await this.prisma.user.findMany();
    const attendances = await this.prisma.attendance.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
    });

    const userIdsWithAttendance = new Set(attendances.map((a) => a.userId));
    const userIdsWithOnlyCheckIn = new Set(
      attendances.filter((a) => a.checkIn && !a.checkOut).map((a) => a.userId),
    );

    let created = 0;
    let updated = 0;

    //create attendance for unregistered users
    for (const user of users) {
      if (!userIdsWithAttendance.has(user.id)) {
        await this.prisma.attendance.create({
          data: {
            userId: user.id,
            modality: user.modality,
            status: Status.ABSENT,
            checkIn: null,
            checkOut: null,
            createdAt: start,
          },
        });
        created++;
      }
    }

    //update attendance for users with only checkIn
    for (const userId of userIdsWithOnlyCheckIn) {
      await this.prisma.attendance.updateMany({
        where: {
          userId,
          createdAt: { gte: start, lte: end },
          checkOut: null,
        },
        data: {
          status: 'ABSENT',
        },
      });
      updated++;
    }
    return { created, updated };
  }
}
