import { Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Controller } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** GET /api — verifie que l'API est en ligne (utilisé par Vercel et par le front) */
  @Get()
  ping() {
    return this.appService.ping();
  }
}
