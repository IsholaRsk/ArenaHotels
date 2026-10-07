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
import { Role } from '../common/enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
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

  /** GET /api/chambres/:id — detail d'une chambre + ses reservations */
  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.service.findOneAvecReservations(id);
  }

  /** POST /api/chambres (ADMIN, RECEPTIONNISTE) */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  create(@Body() dto: CreateChambreDto) {
    return this.service.create(dto);
  }

  /** PATCH /api/chambres/:id (ADMIN, RECEPTIONNISTE) */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateChambreDto,
  ) {
    return this.service.update(id, dto);
  }

  /** DELETE /api/chambres/:id (ADMIN) */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.service.remove(id);
  }
}
