import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from './config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AllConfigType>);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.getOrThrow('kafka.clientId', { infer: true }),
        brokers: configService.getOrThrow('kafka.brokers', { infer: true }),
      },
      consumer: {
        groupId: configService.getOrThrow('kafka.groupId', { infer: true }),
      },
      subscribe: {
        fromBeginning: true,
      },
    },
  });

  await app.startAllMicroservices();

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
bootstrap();
