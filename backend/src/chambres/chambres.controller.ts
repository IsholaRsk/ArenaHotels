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
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permission, Role } from '../common/enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ChambresService } from './chambres.service';
import {
  CreateChambreDto,
  FiltreChambresQueryDto,
  UpdateChambreDto,
} from './dto/create-chambre.dto';
import { DisponibiliteQueryDto } from './dto/disponibilite-query.dto';

/**
 * Controleur chambres.
 * La lecture du catalogue est publique (comme sur un site d'hotel) ;
 * l'ecriture exige un JWT et le role ADMIN ou RECEPTIONNISTE.
 */
@Controller('chambres')
export class ChambresController {
  constructor(private readonly service: ChambresService) {}

  /** GET /api/chambres/disponibilites?arrivee=&depart=&personnes=&type= */
  @Get('disponibilites')
  disponibilites(@Query() query: DisponibiliteQueryDto) {
    return this.service.trouverDisponibilites(query);
  }

  /** GET /api/chambres?page=1&limit=10&type=&statut=&recherche= */
  @Get()
  findAll(@Query() query: FiltreChambresQueryDto) {
    return this.service.findAll(query);
  }

  /** GET /api/chambres/:id — detail d'une chambre. L'historique des reservations
   *  n'est renvoye qu'au personnel (ADMIN/RECEPTIONNISTE) ; un visiteur ou un
   *  client ne voit que la fiche publique de la chambre. */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(
    @Param('id', ParseIdPipe) id: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.service.findOneAvecReservations(id, user);
  }

  /** POST /api/chambres — creation (ROOM_CREATE : ADMIN) */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(Permission.ROOM_CREATE)
  create(@Body() dto: CreateChambreDto) {
    return this.service.create(dto);
  }

  /**
   * PATCH /api/chambres/:id — mise a jour (ROOM_UPDATE : ADMIN, RECEPTIONNISTE).
   * Les tarifs (prixParNuit) sont reserves a l'ADMIN ("gerer tarifs").
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(Permission.ROOM_UPDATE)
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateChambreDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user?.role !== Role.ADMIN) {
      delete dto.prixParNuit;
    }
    return this.service.update(id, dto);
  }

  /** DELETE /api/chambres/:id — suppression (ROOM_DELETE : ADMIN) */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions(Permission.ROOM_DELETE)
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.service.remove(id);
  }
}
