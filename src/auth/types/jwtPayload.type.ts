import { Modality, Roles } from 'src/common/enums/roles.enum';

export type JwtPayload = {
  email: string;
  sub: string;
  modality: Modality;
  role: Roles;
};

export type JWtPayloadWithToken = JwtPayload & {
  accessToken: string;
};
