import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Modality, Prisma } from '@prisma/client';
import {
  add,
  endOfDay,
  endOfWeek,
  format,
  set,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Status } from 'src/common/enums/roles.enum';
import { ConfigService } from 'src/config/config.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { CheckInDto, CheckOutDto, FiltersDto } from './dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async checkIn(userId: string, modality: Modality, checkInDto: CheckInDto) {
    await this.userService.findOne(userId);

    //validate double attendance in one day
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const attendanceFound = await this.prisma.attendance.findFirst({
      where: {
        userId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    if (attendanceFound) {
      throw new BadRequestException('Ya se registro la asistencia de ingreso');
    }

    //validate config
    const configFound = (await this.configService.findAll())[0];

    if (!configFound) {
      throw new InternalServerErrorException(
        'Configuración no encontrada, intente más tarde o contacte al administrador',
      );
    }

    //validate checkIn
    const { checkIn } = checkInDto;
    if (checkIn < configFound.startTime || checkIn > configFound.endTime) {
      throw new BadRequestException('La hora de entrada o salida no es válida');
    }

    //is Late
    const [h, m] = configFound.startTime.split(':').map(Number);
    const toleranceTime = add(
      set(new Date(), { hours: h, minutes: m, seconds: 0 }),
      { minutes: configFound.toleranceMin },
    );

    const isLate = checkIn > format(toleranceTime, 'HH:mm:ss', { locale: es });
    const status = isLate ? Status.LATE : Status.PRESENT;

    await this.prisma.attendance.create({
      data: {
        userId,
        checkIn,
        status,
        modality,
      },
    });

    return {
      message: 'Asistencia de ingreso registrada exitosamente',
    };
  }

  async checkout(userId: string, checkOutDto: CheckOutDto) {
    await this.userService.findOne(userId);

    //validate if checkout has registered
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const attendanceFound = await this.prisma.attendance.findFirst({
      where: {
        userId,
        checkOut: {
          not: null,
        },
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    if (attendanceFound) {
      throw new BadRequestException('Ya se registro la asistencia de salida');
    }

    //validate config
    const configFound = (await this.configService.findAll())[0];

    if (!configFound) {
      throw new InternalServerErrorException(
        'Configuración no encontrada, intente más tarde o contacte al administrador',
      );
    }

    const { checkOut } = checkOutDto;

    if (checkOut < configFound.startTime || checkOut > configFound.endTime) {
      throw new BadRequestException('La hora de entrada o salida no es válida');
    }

    await this.prisma.attendance.updateMany({
      where: {
        userId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      data: {
        checkOut,
      },
    });
    return {
      message: 'Asistencia de salida registrada exitosamente',
    };
  }

  async findAll(query: FiltersDto) {
    const regex = /^[a-zA-Z]+-(ASC|DESC|asc|desc)$/;
    const { search, page, limit, sort, currentDay, currentWeek, daysAgo } =
      query;

    const activeDateFilters = [currentDay, currentWeek, !!daysAgo].filter(
      Boolean,
    );
    if (activeDateFilters.length > 1) {
      throw new BadRequestException(
        'No se puede usar más de un filtro de fecha a la vez (currentDay, currentWeek, daysAgo)',
      );
    }

    const allowedSortFields = ['checkIn', 'checkOut', 'createdAt'];
    if (
      sort &&
      (!regex.test(sort) || !allowedSortFields.includes(sort.split('-')[0]))
    ) {
      throw new BadRequestException(
        'El orden debe ser en el formato campo-asc o campo-desc',
      );
    }

    const orderBy: Prisma.AttendanceOrderByWithRelationInput = sort
      ? {
          [sort.split('-')[0]]:
            sort.split('-')[1].toLowerCase() === 'asc' ? 'asc' : 'desc',
        }
      : undefined;

    let where: Prisma.AttendanceWhereInput = search
      ? {
          OR: [
            {
              user: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
            {
              user: {
                lastName: { contains: search, mode: 'insensitive' },
              },
            },
          ],
        }
      : undefined;

    //add filters
    if (daysAgo) {
      where = {
        ...where,
        createdAt: {
          gte: startOfDay(subDays(new Date(), daysAgo)),
        },
      };
    } else if (currentWeek) {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      const end = endOfWeek(new Date(), { weekStartsOn: 1 });
      where = {
        ...where,
        createdAt: {
          gte: start,
          lte: end,
        },
      };
    } else if (currentDay) {
      where = {
        ...where,
        createdAt: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        },
      };
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            lastName: true,
            email: true,
            modality: true,
            department: true,
          },
        },
      },
    });
    const total = await this.prisma.attendance.count({ where });
    return {
      attendances,
      meta: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    };
  }

  async findAttendanceByUser(query: FiltersDto, userId: string) {
    await this.userService.findOne(userId);
    const regex = /^[a-zA-Z]+-(ASC|DESC|asc|desc)$/;
    const { search, page, limit, sort, currentDay, currentWeek, daysAgo } =
      query;

    const activeDateFilters = [currentDay, currentWeek, !!daysAgo].filter(
      Boolean,
    );
    if (activeDateFilters.length > 1) {
      throw new BadRequestException(
        'No se puede usar más de un filtro de fecha a la vez (currentDay, currentWeek, daysAgo)',
      );
    }

    const allowedSortFields = ['checkIn', 'checkOut', 'createdAt'];
    if (
      sort &&
      (!regex.test(sort) || !allowedSortFields.includes(sort.split('-')[0]))
    ) {
      throw new BadRequestException(
        'El orden debe ser en el formato campo-asc o campo-desc',
      );
    }

    const orderBy: Prisma.AttendanceOrderByWithRelationInput = sort
      ? {
          [sort.split('-')[0]]:
            sort.split('-')[1].toLowerCase() === 'asc' ? 'asc' : 'desc',
        }
      : undefined;

    let where: Prisma.AttendanceWhereInput = search
      ? {
          userId,
          OR: [
            {
              user: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
            {
              user: {
                lastName: { contains: search, mode: 'insensitive' },
              },
            },
          ],
        }
      : {
          userId,
        };

    //add filters
    if (daysAgo) {
      where = {
        ...where,
        createdAt: {
          gte: startOfDay(subDays(new Date(), daysAgo)),
        },
      };
    } else if (currentWeek) {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      const end = endOfWeek(new Date(), { weekStartsOn: 1 });
      where = {
        ...where,
        createdAt: {
          gte: start,
          lte: end,
        },
      };
    } else if (currentDay) {
      where = {
        ...where,
        createdAt: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        },
      };
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            lastName: true,
            email: true,
            modality: true,
            department: true,
          },
        },
      },
    });
    const total = await this.prisma.attendance.count({ where });
    return {
      attendances,
      meta: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    };
  }

  // Get number of attendances for current month and year
  async getAttendanceByMonth(userId: string): Promise<number> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);

    const attendanceCount = await this.prisma.attendance.count({
      where: {
        userId,
        createdAt: {
          gte: firstDay,
          lte: lastDay,
        },
      },
    });
    return attendanceCount;
  }

  // Get attendance for today
  async getAttendanceToday(userId: string) {
    const today = new Date();
    const startDay = startOfDay(today);
    const endDay = endOfDay(today);

    const attendanceToday = await this.prisma.attendance.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDay,
          lte: endDay,
        },
      },
    });
    return attendanceToday;
  }

  async findUserByDashboard(id: string) {
    const user = await this.userService.findOne(id);
    const attendanceByMonth = await this.getAttendanceByMonth(id);
    const attendanceToday = await this.getAttendanceToday(id);
    const config = await this.configService.findAll();
    if (!config.length) {
      throw new NotFoundException(
        'Configuración no encontrada, o no definida aún, comuniquese con el administrador',
      );
    }
    const countOnline = await this.userService.getCountOnline();
    return {
      ...user,
      attendanceByMonth,
      attendanceToday: {
        attendance: attendanceToday,
        config: {
          startTime: config[0]?.startTime,
          endTime: config[0]?.endTime,
          toleranceMin: config[0]?.toleranceMin,
        },
        countOnline,
      },
    };
  }
}
