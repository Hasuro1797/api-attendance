import { QueryDto } from 'src/common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class FiltersDto extends QueryDto {
  @ApiProperty({
    description: 'Número de días atrás',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  @IsInt({ message: 'El número de días debe ser un número entero' })
  daysAgo?: number;

  @ApiProperty({
    description: 'Semana actual',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El valor debe ser un booleano' })
  @Transform(({ value }) => value === 'true')
  currentWeek?: boolean;

  @ApiProperty({
    description: 'Dia actual',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El valor debe ser un booleano' })
  @Transform(({ value }) => value === 'true')
  currentDay?: boolean;
}
