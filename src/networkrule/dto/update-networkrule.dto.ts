import { PartialType } from '@nestjs/swagger';
import { CreateNetworkruleDto } from './create-networkrule.dto';

export class UpdateNetworkruleDto extends PartialType(CreateNetworkruleDto) {}
