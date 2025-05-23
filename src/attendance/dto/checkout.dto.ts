import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckOutDto {
  @ApiProperty({
    example: '10:00:20',
    description: 'Hora de salida',
    required: true,
  })
  @IsString({ message: 'La hora de salida debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La hora de salida es obligatoria' })
  checkOut: string;
}
