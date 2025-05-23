import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { Modality, Roles } from 'src/common/enums/roles.enum';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: 'Modalidad del usuario',
    enum: Modality,
    required: false,
  })
  @IsEnum(Modality, {
    message: 'Modalidad inválida solo puede ser PRESENTIAL o REMOTE',
  })
  @IsOptional()
  modality?: Modality;

  @ApiProperty({
    description: 'Rol del usuario',
    enum: Roles,
    required: false,
  })
  @IsEnum(Roles, {
    message: 'Rol inválido solo puede ser USER o ADMIN',
  })
  @IsOptional()
  role?: Roles;
}
