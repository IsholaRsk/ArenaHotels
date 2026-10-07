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
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permission, Role } from '../common/enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import {
  CreateReservationDto,
  FiltreReservationsQueryDto,
  UpdateReservationDto,
  UpdateStatutReservationDto,
} from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

/**
 * Controleur reservations.
 * Autorisation granulaire par permission (@Permissions) :
 *  - tout le monde peut reserver (RESERVATION_CREATE)
 *  - un CLIENT ne voit / modifie / annule que SES reservations (portee verifiee cote service)
 *  - le personnel gere toutes les reservations, le planning et le check-in/out
 */
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  /** GET /api/reservations/planning?mois=2026-10 — planning mensuel (personnel) */
  @Get('planning')
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  planning(@Query('mois') mois: string) {
    const defaut = new Date().toISOString().slice(0, 7);
    return this.service.planning(mois || defaut);
  }

  /** GET /api/reservations — liste (un CLIENT ne recoit que les siennes) */
  @Get()
  @Permissions(Permission.RESERVATION_READ)
  findAll(
    @Query() query: FiltreReservationsQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findAll(query, user);
  }

  /** GET /api/reservations/:id — detail (portee verifiee pour un CLIENT) */
  @Get(':id')
  @Permissions(Permission.RESERVATION_READ)
  findOne(
    @Param('id', ParseIdPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  /** POST /api/reservations — nouvelle reservation (verifie les disponibilites) */
  @Post()
  @Permissions(Permission.RESERVATION_CREATE)
  create(@Body() dto: CreateReservationDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  /** PATCH /api/reservations/:id — modification (un CLIENT uniquement sur les siennes) */
  @Patch(':id')
  @Permissions(Permission.RESERVATION_UPDATE)
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateReservationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user);
  }

  /** PATCH /api/reservations/:id/statut — confirmer, annuler, check-in/out, cloturer */
  @Patch(':id/statut')
  @Permissions(Permission.RESERVATION_UPDATE)
  updateStatut(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateStatutReservationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateStatut(id, dto.statut, user);
  }

  /** DELETE /api/reservations/:id — suppression definitive (personnel uniquement) */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.service.remove(id);
  }
}
