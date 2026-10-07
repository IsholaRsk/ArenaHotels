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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
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
 * Controleur reservations : toutes les routes sont protegees par JWT.
 * Un client peut reserver ; la gestion complete est reservee au personnel.
 */
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  /** GET /api/reservations/planning?mois=2026-10 — planning mensuel par chambre */
  @Get('planning')
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  planning(@Query('mois') mois: string) {
    const defaut = new Date().toISOString().slice(0, 7);
    return this.service.planning(mois || defaut);
  }

  /** GET /api/reservations?page=1&limit=10&statut=&chambreId=&clientId=&mois= */
  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  findAll(@Query() query: FiltreReservationsQueryDto) {
    return this.service.findAll(query);
  }

  /** GET /api/reservations/:id */
  @Get(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.service.findOne(id);
  }

  /** POST /api/reservations — nouvelle reservation (verifie les disponibilites) */
  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE, Role.CLIENT)
  create(@Body() dto: CreateReservationDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  /** PATCH /api/reservations/:id */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.service.update(id, dto);
  }

  /** PATCH /api/reservations/:id/statut — confirmer, annuler ou cloturer */
  @Patch(':id/statut')
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  updateStatut(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateStatutReservationDto,
  ) {
    return this.service.updateStatut(id, dto.statut);
  }

  /** DELETE /api/reservations/:id */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.service.remove(id);
  }
}
