import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Modality } from 'src/common/enums/roles.enum';

export class CreateNetworkruleDto {
  @ApiProperty({
    example: 'name',
    description: 'Nombre de la regla',
    required: true,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @ApiProperty({
    example: '192.168.1.1',
    description: 'IP de inicio',
    required: true,
  })
  @IsString({ message: 'La IP de inicio debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La IP de inicio es obligatoria' })
  ipStart: string;

  @ApiProperty({
    example: '192.168.1.255',
    description: 'IP de fin',
    required: true,
  })
  @IsString({ message: 'La IP de fin debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La IP de fin es obligatoria' })
  ipEnd: string;

  @ApiProperty({
    example: 'REMOTE',
    description: 'Modalidad',
    required: true,
  })
  @IsString({ message: 'La modalidad debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La modalidad es obligatoria' })
  @IsEnum(Modality, { message: 'La modalidad debe ser PRESENTIAL o REMOTE' })
  modality: Modality;
}
