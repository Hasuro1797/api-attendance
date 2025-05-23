import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Roles } from 'src/common/enums/roles.enum';

@Injectable()
export class ConfigService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createConfigDto: CreateConfigDto) {
    const configFound = await this.prismaService.config.findFirst();
    if (configFound) {
      throw new BadRequestException('Ya existe una configuración');
    }
    const newConfig = await this.prismaService.config.create({
      data: createConfigDto,
    });
    return newConfig;
  }

  async findAll() {
    const configs = await this.prismaService.config.findMany();
    return configs;
  }

  async update(id: number, updateConfigDto: UpdateConfigDto) {
    const userFound = await this.prismaService.user.findUnique({
      where: { id: updateConfigDto.updateBy, role: Roles.ADMIN },
    });
    if (!userFound) {
      throw new BadRequestException(
        'Usuario con id no encontrado o no autorizado',
      );
    }
    const updatedConfig = await this.prismaService.config.update({
      where: { id },
      data: updateConfigDto,
    });
    return updatedConfig;
  }
}
