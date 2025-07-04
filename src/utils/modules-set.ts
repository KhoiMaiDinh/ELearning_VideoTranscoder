import { BullModule } from '@nestjs/bullmq';
import { ModuleMetadata } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AllConfigType } from 'src/config';
import redisConfig from 'src/redis/config/redis.config';
import loggerFactory from './logger-factory';
import appConfig from 'src/config/app.config';
import { BackgroundModule } from 'src/background/background.module';
import { KafkaModule } from '@/kafka';
import kafkaConfig from 'src/kafka/config/kafka.config';
import { ConsumerModule } from 'src/consumers/consumer.module';
import minioConfig from 'src/libs/minio/config/minio.config';
import { ApiModule } from 'src/api/api.module';

function generateModulesSet(): ModuleMetadata['imports'] {
  const imports: ModuleMetadata['imports'] = [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig, appConfig, kafkaConfig, minioConfig],
      envFilePath: ['.env'],
    }),
  ];
  let customModules: ModuleMetadata['imports'] = [];

  const bullModule = BullModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService<AllConfigType>) => {
      return {
        connection: {
          host: configService.getOrThrow('redis.host', {
            infer: true,
          }),
          port: configService.getOrThrow('redis.port', {
            infer: true,
          }),
          password: configService.getOrThrow('redis.password', {
            infer: true,
          }),
          tls: configService.get('redis.tlsEnabled', { infer: true }),
        },
      };
    },
    inject: [ConfigService],
  });

  const loggerModule = LoggerModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: loggerFactory,
  });

  customModules = [
    ApiModule,
    bullModule,
    loggerModule,
    BackgroundModule,
    KafkaModule,
    ConsumerModule,
  ];

  return imports.concat(customModules);
}

export default generateModulesSet;
