import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly service: StatsService) {}

  /** GET /api/stats/tableau-de-bord — indicateurs de la page d'accueil */
  @Get('tableau-de-bord')
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  tableauDeBord() {
    return this.service.tableauDeBord();
  }
}
