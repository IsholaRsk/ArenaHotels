import { Module } from '@nestjs/common';
import { ChambresController } from './chambres.controller';
import { ChambresService } from './chambres.service';

@Module({
  controllers: [ChambresController],
  providers: [ChambresService],
  exports: [ChambresService],
})
export class ChambresModule {}
