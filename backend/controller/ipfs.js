import { create } from 'ipfs-http-client';

// Singleton IPFS client instance
export const ipfs = create({ url: 'http://localhost:5001' });

export async function uploadBufferToIPFS(buffer, filename) {
  // buffer: Buffer, filename: string
  const { cid } = await ipfs.add({ content: buffer, path: filename });
  return cid.toString();
}
