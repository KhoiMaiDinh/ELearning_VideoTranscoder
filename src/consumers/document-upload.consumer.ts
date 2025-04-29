import { KafkaTopic, UploadStatus } from '@/constants';
import { KafkaProducerService } from '@/kafka';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MinioEvent } from 'src/redis/interfaces/minio-event.interface';

@Controller()
export class DocumentUploadConsumer {
  constructor(private readonly producerService: KafkaProducerService) {}

  @EventPattern(KafkaTopic.DOCUMENT_UPLOAD)
  handleDocumentUploadMessage(@Payload() message: any) {
    console.log(message);
    const event: MinioEvent = message;
    if (event.Records[0].eventName !== 's3:ObjectCreated:Post') {
      return;
    }

    const { s3 } = event.Records[0];
    const {
      bucket: { name },
      object: { key },
    } = s3;

    if (name != 'document') {
      return;
    }
    console.log('new doc uploaded');

    this.producerService.send(KafkaTopic.DOCUMENT_PROCESS, {
      value: JSON.stringify({
        key,
        status: UploadStatus.VALIDATED,
      }),
    });
  }
}
