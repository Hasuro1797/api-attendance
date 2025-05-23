import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ActiveUser } from 'src/common/decorators';
import { Modality, Roles } from 'src/common/enums/roles.enum';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/checkin.dto';
import { CheckOutDto } from './dto/checkout.dto';
import { FiltersDto } from './dto/filters.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiHeader,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';

@ApiTags('Asistencias')
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
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Auth([Roles.USER, Roles.ADMIN])
  @ApiOperation({
    summary: 'Registrar asistencia',
  })
  @ApiResponse({
    status: 201,
    description: 'Asistencia registrada exitosamente',
  })
  @Post('checkin')
  checkin(
    @ActiveUser('sub') userId: string,
    @ActiveUser('modality') modality: Modality,
    @Body() checkInDto: CheckInDto,
  ) {
    return this.attendanceService.checkIn(userId, modality, checkInDto);
  }

  @Auth([Roles.ADMIN])
  @ApiOperation({
    summary: 'Listar asistencias de todos los usuarios',
    description: 'Solo el admin puede listar asistencias de todos los usuarios',
  })
  @ApiResponse({
    status: 200,
    description: 'Asistencias listadas exitosamente',
  })
  @Get('users')
  findAll(@Query() query: FiltersDto) {
    return this.attendanceService.findAll(query);
  }

  @Auth([Roles.USER, Roles.ADMIN])
  @ApiOperation({
    summary: 'Listar asistencias de un usuario',
    description:
      'Solo el usuario y el admin puede listar asistencias de un usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Asistencias listadas exitosamente',
  })
  @Get('user')
  findAttendanceByUser(
    @ActiveUser('sub') userId: string,
    @Query() query: FiltersDto,
  ) {
    return this.attendanceService.findAttendanceByUser(query, userId);
  }

  @Auth([Roles.USER, Roles.ADMIN])
  @ApiOperation({
    summary: 'Registrar salida',
  })
  @ApiResponse({
    status: 201,
    description: 'Asistencia registrada exitosamente',
  })
  @Post('checkout')
  checkout(
    @ActiveUser('sub') userId: string,
    @Body() checkOutDto: CheckOutDto,
  ) {
    return this.attendanceService.checkout(userId, checkOutDto);
  }

  @Auth([Roles.USER, Roles.ADMIN])
  @ApiOperation({
    summary: 'Información del usuario',
    description:
      'Solo el usuario y el admin puede obtener la información del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del usuario obtenida exitosamente',
  })
  @Get('dashboard')
  findUserByDashboard(@ActiveUser('sub') userId: string) {
    return this.attendanceService.findUserByDashboard(userId);
  }
}
