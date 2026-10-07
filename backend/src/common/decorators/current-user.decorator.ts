import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() recupere l'utilisateur place dans la requete par la JwtStrategy.
 * Exemple : @CurrentUser('role') role: Role
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
