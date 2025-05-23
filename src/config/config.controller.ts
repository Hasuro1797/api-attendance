import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ConfigService } from './config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Roles } from 'src/common/enums/roles.enum';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponse } from '@nestjs/swagger';

@ApiTags('Config')
@Auth([Roles.ADMIN])
@ApiHeader({
  name: 'x-forwarded-for',
  description: 'IP del cliente (para determinar modalidad)',
  required: true,
  example: '179.6.164.200',
})
@ApiBearerAuth('accessToken')
@ApiResponse({
  status: 401,
  description: 'Acceso no autorizado: Token expirado o inválido',
})
@ApiResponse({
  status: 403,
  description: 'Acceso no autorizado: No tienes permisos para estos endpoints',
})
@ApiResponse({
  status: 500,
  description: 'Error al ejecutar el endpoint',
})
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva configuración',
    description: 'Solo el admin puede crear una nueva configuración',
  })
  @ApiResponse({
    status: 201,
    description: 'Configuración creada exitosamente',
  })
  create(@Body() createConfigDto: CreateConfigDto) {
    return this.configService.create(createConfigDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las configuraciones',
    description: 'Solo el admin puede obtener todas las configuraciones',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuraciones obtenidas exitosamente',
  })
  findAll() {
    return this.configService.findAll();
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una configuración',
    description: 'Solo el admin puede actualizar una configuración',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada exitosamente',
  })
  update(@Param('id') id: string, @Body() updateConfigDto: UpdateConfigDto) {
    return this.configService.update(+id, updateConfigDto);
  }
}
