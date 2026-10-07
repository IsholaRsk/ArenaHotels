import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ReponseApi<T> {
  succes: boolean;
  donnees: T;
  meta?: Record<string, unknown>;
  horodatage: string;
}

/**
 * Intercepteur de transformation : formate toutes les reponses de l'API
 * dans une enveloppe homogene { succes, donnees, meta, horodatage }.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ReponseApi<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ReponseApi<T>> {
    return next.handle().pipe(
      map((donnees) => {
        // Un service peut renvoyer { donnees, meta } pour les listes paginées
        if (donnees && typeof donnees === 'object' && 'donnees' in (donnees as object) && 'meta' in (donnees as object)) {
          const enveloppe = donnees as unknown as { donnees: T; meta: Record<string, unknown> };
          return {
            succes: true,
            donnees: enveloppe.donnees,
            meta: enveloppe.meta,
            horodatage: new Date().toISOString(),
          };
        }
        return {
          succes: true,
          donnees,
          horodatage: new Date().toISOString(),
        };
      }),
    );
  }
}
