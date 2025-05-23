import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class QueryDto {
  @IsOptional()
  @IsString({ message: 'La busqueda debe ser un string' })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {
      allowInfinity: false,
      allowNaN: false,
    },
    { message: 'La pagina debe ser un numero positivo' },
  )
  @IsPositive({ message: 'La pagina debe ser un numero positivo' })
  @Min(1, { message: 'La pagina debe ser al menos 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {
      allowInfinity: false,
      allowNaN: false,
    },
    { message: 'El limite debe ser un número entero' },
  )
  @IsPositive({ message: 'El limite debe ser un numero positivo' })
  @Min(1, { message: 'El limite debe ser al menos 1' })
  limit?: number = 10;

  @IsOptional()
  @IsString({
    message: 'El orden debe ser un string en el formato campo-ASC o campo-DESC',
  })
  @Transform(({ value }) => value?.trim())
  sort?: string;
}
