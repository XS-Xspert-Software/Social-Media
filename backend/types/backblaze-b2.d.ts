declare module 'backblaze-b2' {
  export default class B2 {
    constructor(options: { applicationKeyId: string; applicationKey: string });
    authorize(): Promise<any>;
    getBucket(options: { bucketId: string }): Promise<any>;
    getUploadUrl(options: { bucketId: string }): Promise<any>;
    uploadFile(options: {
      uploadUrl: string;
      uploadAuthToken: string;
      fileName: string;
      data: Buffer;
      mime: string;
    }): Promise<any>;
  }
}
