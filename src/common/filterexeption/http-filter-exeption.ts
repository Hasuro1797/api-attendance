import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { UnauthorizedMessages } from '../types/errorTypes';

@Catch(HttpException)
export class HttpExeptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    let message: string | string[];
    if (status === 401) {
      if (typeof exception.getResponse() === 'object') {
        message = this.setResponseMessage(exception.getResponse()['message']);
      } else {
        message = exception.getResponse() as string | string[];
      }
    } else {
      if (typeof exception.getResponse() === 'object') {
        message = exception.getResponse()['message'];
      } else {
        message = exception.getResponse() as string | string[];
      }
    }
    response.status(status).json({
      message,
      statusCode: status,
    });
  }
  private setResponseMessage(message: UnauthorizedMessages) {
    switch (message) {
      case UnauthorizedMessages.INVALID_ACCESS:
        return 'Token invalido o expirado';
      case UnauthorizedMessages.INVALID_CREDENTIALS:
        return 'Credenciales invalidas o IP no autorizado';
      case UnauthorizedMessages.INVALID_PASSWORD:
        return 'Contraseña invalida';
      case UnauthorizedMessages.INVALID_UNAUTHORIZED:
        return 'No autorizado';
      case UnauthorizedMessages.INVALID_IP:
        return 'IP no autorizado o no configurado';
      default:
        return 'No autorizado';
    }
  }
}
