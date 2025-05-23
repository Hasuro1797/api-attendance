import { Module } from '@nestjs/common';
import { NetworkruleService } from './networkrule.service';
import { NetworkruleController } from './networkrule.controller';

@Module({
  controllers: [NetworkruleController],
  providers: [NetworkruleService],
  exports: [NetworkruleService],
})
export class NetworkruleModule {}
