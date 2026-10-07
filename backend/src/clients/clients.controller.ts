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
import { ClientsService } from './clients.service';
import {
  CreateClientDto,
  FiltreClientsQueryDto,
  UpdateClientDto,
} from './dto/create-client.dto';

/** Controleur clients : toutes les routes exigent un JWT valide. */
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  /** GET /api/clients?page=1&limit=10&recherche= */
  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  findAll(@Query() query: FiltreClientsQueryDto) {
    return this.service.findAll(query);
  }

  /** GET /api/clients/:id — fiche + historique des sejours */
  @Get(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.service.findOneAvecHistorique(id);
  }

  /** POST /api/clients (ADMIN, RECEPTIONNISTE) */
  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  create(@Body() dto: CreateClientDto) {
    return this.service.create(dto);
  }

  /** PATCH /api/clients/:id (ADMIN, RECEPTIONNISTE) */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateClientDto,
  ) {
    return this.service.update(id, dto);
  }

  /** DELETE /api/clients/:id (ADMIN) */
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.service.remove(id);
  }
}
