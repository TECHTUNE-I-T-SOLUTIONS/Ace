import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const header = req.headers.authorization as string | undefined;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    try {
      req.user = await this.auth.verifyBearer(token);
      return true;
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof UnauthorizedException
          ? error.message
          : 'Invalid or expired token',
      );
    }
  }
}
