import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Role } from '../common/enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import {
  CreateUtilisateurDto,
  UpdateUtilisateurDto,
} from './dto/create-utilisateur.dto';
import { UtilisateursService } from './utilisateurs.service';

/**
 * Controleur utilisateurs : routes HTTP uniquement, la logique est dans le service.
 * Toutes les routes exigent un JWT ; l'administration est reservee au role ADMIN.
 */
@Controller('utilisateurs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UtilisateursController {
  constructor(private readonly service: UtilisateursService) {}

  /** GET /api/utilisateurs?page=1&limit=10 — liste des comptes (ADMIN) */
  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query.page, query.limit);
  }

  /** GET /api/utilisateurs/moi — profil de l'utilisateur connecte */
  @Get('moi')
  profil(@CurrentUser('sub') id: number) {
    return this.service.findOne(Number(id));
  }

  /** GET /api/utilisateurs/:id (ADMIN) */
  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.service.findOne(id);
  }

  /** POST /api/utilisateurs — creation d'un compte par un administrateur */
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateUtilisateurDto) {
    return this.service.create(dto);
  }

  /** PATCH /api/utilisateurs/:id (ADMIN) */
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateUtilisateurDto,
  ) {
    return this.service.update(id, dto);
  }

  /** DELETE /api/utilisateurs/:id (ADMIN) */
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.service.remove(id);
  }
}
