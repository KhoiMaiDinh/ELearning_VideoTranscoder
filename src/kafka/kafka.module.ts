import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaProducerService } from './producer.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AllConfigType } from '@/config';

@Global()
@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'TRANSCODER_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService<AllConfigType>) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get('kafka.clientId', { infer: true }),
              brokers: configService.get('kafka.brokers', { infer: true }),
            },
            consumer: {
              groupId: configService.get('kafka.groupId', { infer: true }),
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [KafkaProducerService],
  exports: [KafkaProducerService],
})
export class KafkaModule {}
