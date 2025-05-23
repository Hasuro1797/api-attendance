import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckInDto {
  @ApiProperty({
    example: '10:00:20',
    description: 'Hora de entrada',
    required: true,
  })
  @IsString({ message: 'La hora de entrada debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La hora de entrada es obligatoria' })
  checkIn: string;
}
