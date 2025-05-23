import { SetMetadata } from '@nestjs/common';
import { Roles } from 'src/common/enums/roles.enum';

export const ROLES_KEY = 'roles';
export const AuthRoles = (...roles: Roles[]) => SetMetadata(ROLES_KEY, roles);
