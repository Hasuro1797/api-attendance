import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateConfigDto {
  @ApiProperty({
    example: '10:00',
    description: 'Hora de inicio',
    required: true,
  })
  @IsString({ message: 'La hora de inicio debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  startTime: string;

  @ApiProperty({
    example: '20:36',
    description: 'Hora de fin',
    required: true,
  })
  @IsString({ message: 'La hora de fin debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
  endTime: string;

  @ApiProperty({
    example: 15,
    description: 'Tolerancia en minutos',
    required: true,
  })
  @IsNumber(
    {
      maxDecimalPlaces: 0,
    },
    { message: 'La tolerancia debe ser un número' },
  )
  @IsNotEmpty({ message: 'La tolerancia es obligatoria' })
  toleranceMin: number;

  @ApiProperty({
    example: 'cmb01ivws0000ud54tomtbwei',
    description: 'Usuario que actualiza',
    required: true,
  })
  @IsString({
    message:
      'El usuario que actualiza debe ser una cadena de texto, mandar su id',
  })
  @IsNotEmpty({ message: 'El usuario que actualiza es obligatorio' })
  updateBy: string;
}
