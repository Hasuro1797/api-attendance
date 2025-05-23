export class ExeptionErrorObject {
  message?: string | string[];
  status: number;
  error?: string;
}
export enum UnauthorizedMessages {
  INVALID_CREDENTIALS = 'Invalid Credentials',
  INVALID_ACCESS = 'Invalid access token',
  INVALID_REFRESH = 'Invalid refresh token',
  INVALID_PASSWORD = 'Invalid password',
  INVALID_IP = 'Invalid ip',
  INVALID_UNAUTHORIZED = 'Unauthorized',
}
