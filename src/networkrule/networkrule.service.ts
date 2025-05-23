import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNetworkruleDto } from './dto/create-networkrule.dto';
import { UpdateNetworkruleDto } from './dto/update-networkrule.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryDto } from 'src/common/dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NetworkruleService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createNetworkruleDto: CreateNetworkruleDto) {
    return this.prisma.netWorkRule.create({
      data: createNetworkruleDto,
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

    const orderBy: Prisma.NetWorkRuleOrderByWithRelationInput = {
      [field]: order.toLowerCase() === 'asc' ? 'asc' : 'desc',
    };
    const where: Prisma.NetWorkRuleWhereInput = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
              ipStart: {
                contains: search,
                mode: 'insensitive',
              },
              ipEnd: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {};
    const networkrules = await this.prisma.netWorkRule.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        ipStart: true,
        ipEnd: true,
        modality: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const total = await this.prisma.netWorkRule.count({ where });
    return {
      networkrules,
      meta: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    };
  }

  async findOne(id: number) {
    const networkrule = await this.prisma.netWorkRule.findUnique({
      where: { id },
    });
    if (!networkrule) {
      throw new NotFoundException('Networkrule no encontrado');
    }
    return networkrule;
  }

  async update(id: number, updateNetworkruleDto: UpdateNetworkruleDto) {
    await this.findOne(id);
    return await this.prisma.netWorkRule.update({
      where: { id },
      data: updateNetworkruleDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.netWorkRule.delete({ where: { id } });
    return {
      message: 'Networkrule eliminada exitosamente',
    };
  }
}
