interface MinioEventRecord {
  eventVersion: string;
  eventSource: string;
  awsRegion: string;
  eventTime: string;
  eventName: string;
  userIdentity: Record<string, any>;
  requestParameters: Record<string, any>;
  responseElements: Record<string, any>;
  s3: s3;
  source: Record<string, any>;
}

interface s3 {
  bucket: {
    name: string;
    ownerIdentity: {
      principalId: string;
    };
    arn: string;
  };
  object: {
    key: string;
    size: number;
    eTag: string;
    contentType: string;
    userMetadata: any;
    sequencer: string;
  };
}

interface MinioEvent {
  Records: MinioEventRecord[];
}

export { MinioEventRecord, MinioEvent };
