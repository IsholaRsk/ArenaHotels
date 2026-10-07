import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/** Filtres de pagination communs a toutes les listes de l'API */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page doit etre un entier' })
  @Min(1, { message: 'page doit etre >= 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit doit etre un entier' })
  @Min(1, { message: 'limit doit etre >= 1' })
  limit?: number = 10;
}
