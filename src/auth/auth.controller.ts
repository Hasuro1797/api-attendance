import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signin.dto';
import { Auth } from './decorators/auth.decorator';
import { Roles } from 'src/common/enums/roles.enum';
import { ActiveUser } from 'src/common/decorators';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@ApiTags('Autorización')
@ApiResponse({ status: 500, description: 'Error al autenticar' })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signIn')
  @ApiHeader({
    name: 'x-forwarded-for',
    description: 'IP del cliente simulada (para determinar modalidad)',
    required: true,
    example: '179.6.164.200',
  })
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @HttpCode(HttpStatus.OK)
  signIn(@Body() signInDto: SignInDto, @Request() req) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : (forwarded || '').split(',')[0];
    return this.authService.signIn(
      signInDto,
      ip.toString().trim() || req.socket.remoteAddress || '',
    );
  }

  @Auth([Roles.ADMIN, Roles.USER])
  @Post('signOut')
  @ApiBearerAuth('accessToken')
  @ApiHeader({
    name: 'x-forwarded-for',
    description: 'IP del cliente (para determinar modalidad)',
    required: true,
    example: '179.6.164.200',
  })
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Cierre de sesión exitoso' })
  @ApiResponse({
    status: 401,
    description: 'Acceso no autorizado: Token expirado o inválido',
  })
  @HttpCode(HttpStatus.OK)
  signOut(
    @ActiveUser('accessToken') accessToken: string,
    @ActiveUser('sub') userId: string,
  ) {
    return this.authService.signOut(accessToken, userId);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Registrar admin' })
  @ApiResponse({ status: 200, description: 'Registro exitoso' })
  @ApiResponse({ status: 400, description: 'Error al registrar' })
  @HttpCode(HttpStatus.OK)
  signup(@Body() signupDto: CreateUserDto) {
    return this.authService.signup(signupDto);
  }

  @Get('verify-token')
  @HttpCode(HttpStatus.OK)
  verifyToken(@ActiveUser('sub') userId: string) {
    return {
      message: 'Token válido',
      userId,
    };
  }

  @Get('profile')
  @Auth([Roles.ADMIN, Roles.USER])
  @ApiBearerAuth('accessToken')
  @ApiOperation({ summary: 'Obtener perfil' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  @ApiResponse({
    status: 401,
    description: 'Acceso no autorizado: Token expirado o inválido',
  })
  @ApiResponse({
    status: 403,
    description:
      'Acceso no autorizado: No tienes permisos para estos endpoints',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @HttpCode(HttpStatus.OK)
  getProfile(@ActiveUser('sub') userId: string) {
    return this.authService.getProfile(userId);
  }
}
