import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { NetworkruleService } from './networkrule.service';
import { CreateNetworkruleDto } from './dto/create-networkrule.dto';
import { UpdateNetworkruleDto } from './dto/update-networkrule.dto';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Roles } from 'src/common/enums/roles.enum';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponse } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto';

@Auth([Roles.ADMIN])
@ApiTags('Networkrule')
@ApiBearerAuth('accessToken')
@ApiHeader({
  name: 'x-forwarded-for',
  description: 'IP del cliente (para determinar modalidad)',
  required: true,
  example: '179.6.164.200',
})
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
@Controller('networkrule')
export class NetworkruleController {
  constructor(private readonly networkruleService: NetworkruleService) {}

  @ApiOperation({
    summary: 'Crear una nueva regla de red',
    description: 'Solo el admin puede crear una regla de red',
  })
  @ApiResponse({
    status: 201,
    description: 'Regla de red creada exitosamente',
  })
  @Post()
  create(@Body() createNetworkruleDto: CreateNetworkruleDto) {
    return this.networkruleService.create(createNetworkruleDto);
  }

  @ApiOperation({
    summary: 'Obtener todas las reglas de red',
    description: 'Solo el admin puede obtener todas las reglas de red',
  })
  @ApiResponse({
    status: 200,
    description: 'Reglas de red obtenidas exitosamente',
  })
  @Get()
  findAll(@Query() query: QueryDto) {
    return this.networkruleService.findAll(query);
  }

  @ApiOperation({
    summary: 'Obtener una regla de red por ID',
    description: 'Solo el admin puede obtener una regla de red por ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Regla de red obtenida exitosamente',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.networkruleService.findOne(+id);
  }

  @ApiOperation({
    summary: 'Actualizar una regla de red',
    description: 'Solo el admin puede actualizar una regla de red',
  })
  @ApiResponse({
    status: 200,
    description: 'Regla de red actualizada exitosamente',
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNetworkruleDto: UpdateNetworkruleDto,
  ) {
    return this.networkruleService.update(+id, updateNetworkruleDto);
  }

  @ApiOperation({
    summary: 'Eliminar una regla de red',
    description: 'Solo el admin puede eliminar una regla de red',
  })
  @ApiResponse({
    status: 200,
    description: 'Regla de red eliminada exitosamente',
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.networkruleService.remove(+id);
  }
}
