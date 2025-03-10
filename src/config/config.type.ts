import { RedisConfig } from 'src/redis/config/redis-config.type';
import { AppConfig } from './app-config.type';

export type AllConfigType = {
  app: AppConfig;
  redis: RedisConfig;
};
