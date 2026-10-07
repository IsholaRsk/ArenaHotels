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
import { ClientsService } from './clients.service';
import {
  CreateClientDto,
  FiltreClientsQueryDto,
  UpdateClientDto,
} from './dto/create-client.dto';

/** Controleur clients : JWT obligatoire + autorisation par permission. */
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  /** GET /api/clients?page=1&limit=10&recherche= (personnel) */
  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  findAll(@Query() query: FiltreClientsQueryDto) {
    return this.service.findAll(query);
  }

  /** GET /api/clients/:id — fiche + historique (un CLIENT uniquement la sienne) */
  @Get(':id')
  @Permissions(Permission.CLIENT_READ)
  findOne(
    @Param('id', ParseIdPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOneAvecHistorique(id, user);
  }

  /** POST /api/clients (ADMIN, RECEPTIONNISTE) */
  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONNISTE)
  create(@Body() dto: CreateClientDto) {
    return this.service.create(dto);
  }

  /** PATCH /api/clients/:id — un CLIENT ne modifie que sa propre fiche */
  @Patch(':id')
  @Permissions(Permission.CLIENT_UPDATE)
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user);
  }

  /** DELETE /api/clients/:id (ADMIN) */
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.service.remove(id);
  }
}
