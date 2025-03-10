import { BullModule } from '@nestjs/bullmq';
import { ModuleMetadata } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AllConfigType } from 'src/config';
import redisConfig from 'src/redis/config/redis.config';
import loggerFactory from './logger-factory';
import appConfig from 'src/config/app.config';
import { BackgroundModule } from 'src/background/background.module';
import { RedisListenerModule } from 'src/redis/redis-listerner.module';

function generateModulesSet(): ModuleMetadata['imports'] {
  const imports: ModuleMetadata['imports'] = [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig, appConfig],
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
    bullModule,
    loggerModule,
    BackgroundModule,
    RedisListenerModule,
  ];

  return imports.concat(customModules);
}

export default generateModulesSet;
