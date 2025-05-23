import {
  Body,
  Controller,
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
    const clientIp =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    return this.authService.signIn(signInDto, clientIp.toString());
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
}
