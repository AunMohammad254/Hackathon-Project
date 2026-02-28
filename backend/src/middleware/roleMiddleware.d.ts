import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
export declare const authorizeRoles: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=roleMiddleware.d.ts.map