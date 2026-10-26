import { Module } from '@nestjs/common';
import { MetaCapiService } from './meta-capi.service.js';

@Module({ providers: [MetaCapiService], exports: [MetaCapiService] })
export class MarketingModule {}
