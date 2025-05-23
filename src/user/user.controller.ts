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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Roles } from 'src/common/enums/roles.enum';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto';

@Auth([Roles.ADMIN])
@ApiHeader({
  name: 'x-forwarded-for',
  description: 'IP del cliente (para determinar modalidad)',
  required: true,
  example: '179.6.164.200',
})
@ApiBearerAuth('accessToken')
@ApiTags('Usuarios')
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
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Crear usuario',
    description: 'Solo el admin puede crear usuarios',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({
    summary: 'Listar usuarios',
    description: 'Solo el admin puede listar usuarios',
  })
  @ApiResponse({ status: 200, description: 'Usuarios listados exitosamente' })
  @Get()
  findAll(@Query() query: QueryDto) {
    return this.userService.findAll(query);
  }

  @ApiOperation({
    summary: 'Buscar usuario por ID',
    description: 'Solo el admin puede buscar usuarios por ID',
  })
  @ApiResponse({ status: 200, description: 'Usuario encontrado exitosamente' })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @ApiOperation({
    summary: 'Actualizar usuario',
    description: 'Solo el admin puede actualizar usuarios',
  })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @ApiOperation({
    summary: 'Eliminar usuario',
    description: 'Solo el admin puede eliminar usuarios',
  })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
