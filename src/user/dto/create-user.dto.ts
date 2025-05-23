import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'John',
    description: 'Nombre del usuario',
    required: true,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Apellido del usuario',
    required: true,
  })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Correo electrónico del usuario',
    required: true,
  })
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @ApiProperty({
    example: '123456789',
    description: 'Número de teléfono del usuario',
    required: false,
  })
  @IsString({ message: 'El número de teléfono debe ser una cadena de texto' })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Password123*',
    description: 'Contraseña del usuario',
    required: true,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*[^\w\s#<>]).{8,}$/, {
    message:
      'La contraseña debe contener al menos una mayúscula, un carácter especial (excluyendo #, <, >) y tener al menos 8 caracteres',
  })
  password: string;

  @ApiProperty({
    example: 'Area de Recursos Humanos',
    description: 'Departamento donde se encuentra el usuario',
    required: true,
  })
  @IsString({ message: 'El departamento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El departamento es obligatorio' })
  department: string;
}
