import { Module } from '@nestjs/common';
import { EmailService } from './email.service.js';
import { SequenceService } from './sequence.service.js';

@Module({ providers: [EmailService, SequenceService], exports: [EmailService, SequenceService] })
export class EmailModule {}
