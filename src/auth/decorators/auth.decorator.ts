import { applyDecorators } from '@nestjs/common';
import { Roles } from 'src/common/enums/roles.enum';
import { UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../guards/access_token.guard';
import { RoleGuard } from '../guards/role.guard';
import { AuthRoles } from './role.decorator';

export const Auth = (roles: Roles[]) =>
  applyDecorators(AuthRoles(...roles), UseGuards(AccessTokenGuard, RoleGuard));
