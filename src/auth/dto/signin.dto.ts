import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email del usuario',
    required: true,
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email es requerido' })
  email: string;

  @ApiProperty({
    example: 'password',
    description: 'Contraseña del usuario',
    required: true,
  })
  @IsString({ message: 'Contraseña debe ser una cadena' })
  @IsNotEmpty({ message: 'Contraseña es requerida' })
  password: string;
}
