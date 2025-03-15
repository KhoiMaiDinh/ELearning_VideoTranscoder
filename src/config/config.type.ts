import { RedisConfig } from 'src/redis/config/redis-config.type';
import { AppConfig } from './app-config.type';
import { KafkaConfig } from 'src/kafka';
import { MinioConfig } from 'src/libs/minio';

export type AllConfigType = {
  app: AppConfig;
  redis: RedisConfig;
  kafka: KafkaConfig;
  storage: MinioConfig;
};
