import { Modality, Roles } from 'src/common/enums/roles.enum';

export class User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  role: Roles;
  modality: Modality;
  createdAt: Date;
  updatedAt: Date;
}
