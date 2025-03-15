// import { AllConfigType } from '@/config';
import { Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { MinioModule } from 'nestjs-minio-client';
import { MinioClientService } from './minio-client.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config';
import { MinioModule } from 'nestjs-minio-client';

@Module({
  imports: [
    MinioModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService<AllConfigType>) => ({
        endPoint: config.get('storage.host', { infer: true }),
        port: config.get('storage.port', { infer: true }),
        accessKey: config.get('storage.access_key', { infer: true }),
        secretKey: config.get('storage.secret_key', { infer: true }),
        useSSL: false,
      }),
    }),
    ConfigModule,
  ],
  providers: [MinioClientService],
  exports: [MinioClientService],
})
export class MinioClientModule {}
