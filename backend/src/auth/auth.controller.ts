import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /api/auth/register — inscription publique (role CLIENT) */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/auth/login — connexion.
   * Le LocalAuthGuard verifie d'abord les identifiants, puis on signe le JWT.
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Request() req: { user: any }, @Body() _dto: LoginDto) {
    return this.authService.login(req.user);
  }

  /** GET /api/auth/profil — utilisateur correspondant au token envoye */
  @UseGuards(JwtAuthGuard)
  @Get('profil')
  profil(@CurrentUser('sub') id: number) {
    return this.authService.profil(Number(id));
  }

  /**
   * POST /api/auth/logout — le JWT etant sans etat, la deconnexion
   * consiste a supprimer le token cote frontend.
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return { deconnecte: true, message: 'Supprimez le token cote client.' };
  }
}
