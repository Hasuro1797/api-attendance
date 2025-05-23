import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { QueryDto } from 'src/common/dto';
import { Modality, Roles } from 'src/common/enums/roles.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { ipRange } from 'utils/ip.range';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    const { password, ...userInfo } = createUserDto;
    const userExists = await this.findUserByEmail(userInfo.email);
    if (userExists) {
      throw new BadRequestException('Usuario con correo electrónico ya existe');
    }
    const hashedPassword = await this.hashPassword(password);
    return this.prismaService.user.create({
      data: {
        ...userInfo,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        role: true,
        modality: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(query: QueryDto) {
    const regex = /^[a-zA-Z]+-(ASC|DESC|asc|desc)$/;
    const { search, page, limit, sort = 'createdAt-DESC' } = query;
    if (sort && !regex.test(sort)) {
      throw new BadRequestException(
        'El orden debe ser en el formato campo-asc o campo-desc',
      );
    }
    const [field, order] = sort.split('-');

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [field]: order.toLowerCase() === 'asc' ? 'asc' : 'desc',
    };

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
          role: {
            not: Roles.ADMIN,
          },
        }
      : undefined;

    const users = await this.prismaService.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        role: true,
        modality: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const total = await this.prismaService.user.count({ where });
    return {
      users,
      meta: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        role: true,
        modality: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    return await this.prismaService.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prismaService.user.delete({ where: { id } });
    return {
      message: 'Usuario eliminado exitosamente',
    };
  }

  async findUserByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  async ipAllowed(ip: string) {
    const rules = await this.prismaService.netWorkRule.findMany();
    console.log('rules', rules);
    const matchRule = rules.find((rule) =>
      ipRange(ip, rule.ipStart, rule.ipEnd),
    );
    return matchRule;
  }

  async updateOnlineStatus(userId: string, online: boolean) {
    return await this.prismaService.user.update({
      where: { id: userId },
      data: { online },
    });
  }

  async getCountOnline() {
    const countOnline = await this.prismaService.user.count({
      where: { online: true },
    });
    const totalUsers = await this.prismaService.user.count();
    const countPresentialOnline = await this.prismaService.user.count({
      where: { online: true, modality: Modality.PRESENTIAL },
    });
    return {
      countRemoteOnline: countOnline - countPresentialOnline,
      totalUsers,
      countPresentialOnline,
    };
  }
}
