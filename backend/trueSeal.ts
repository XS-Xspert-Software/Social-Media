import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type TrueSealKeyInfo = {
  privateKey: crypto.KeyObject;
  publicKeyPem: string;
  keyCreatedAt: Date;
  instanceId: string;
};

const KEY_DIR = path.resolve(process.cwd(), 'keys');
const PRIVATE_KEY_PATH = path.join(KEY_DIR, 'trueseal_private.pem');
const PUBLIC_KEY_PATH = path.join(KEY_DIR, 'trueseal_public.pem');
const INSTANCE_ID = process.env.INSTANCE_ID || 'SELF_HOSTED_INSTANCE';

function ensureKeyDir() {
  if (!fs.existsSync(KEY_DIR)) {
    fs.mkdirSync(KEY_DIR, { recursive: true });
  }
}

export function loadOrCreateTrueSealKeys(): TrueSealKeyInfo {
  ensureKeyDir();
  if (!fs.existsSync(PRIVATE_KEY_PATH) || !fs.existsSync(PUBLIC_KEY_PATH)) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicExponent: 0x10001,
    });
    fs.writeFileSync(
      PRIVATE_KEY_PATH,
      privateKey.export({ type: 'pkcs8', format: 'pem' })
    );
    fs.writeFileSync(
      PUBLIC_KEY_PATH,
      publicKey.export({ type: 'spki', format: 'pem' })
    );
  }

  const privateKeyPem = fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8');
  const publicKeyPem = fs.readFileSync(PUBLIC_KEY_PATH, 'utf-8');
  const stats = fs.statSync(PRIVATE_KEY_PATH);
  return {
    privateKey: crypto.createPrivateKey(privateKeyPem),
    publicKeyPem,
    keyCreatedAt: stats.mtime,
    instanceId: INSTANCE_ID,
  };
}

type CanonicalInput = {
  id: string;
  author: string;
  instanceId: string;
  timestamp: string;
  body: string;
  parentId?: string | null;
};

export function canonicalize(input: CanonicalInput): Buffer {
  const payload = {
    id: input.id,
    author: input.author,
    instance_id: input.instanceId,
    timestamp: input.timestamp,
    body: input.body,
    parent_id: input.parentId || '',
  };
  const json = JSON.stringify(payload, Object.keys(payload).sort(), 0);
  return Buffer.from(json, 'utf-8');
}

export function signTrueSeal(canonicalBytes: Buffer, keyInfo: TrueSealKeyInfo): string {
  const hash = crypto.createHash('sha256').update(canonicalBytes).digest();
  const sig = crypto.sign('sha256', hash, {
    key: keyInfo.privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN,
  });
  return sig.toString('base64');
}

export function verifyTrueSeal(
  canonicalBytes: Buffer,
  signatureB64: string,
  publicKeyPem: string
): boolean {
  try {
    const hash = crypto.createHash('sha256').update(canonicalBytes).digest();
    return crypto.verify(
      'sha256',
      hash,
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN,
      },
      Buffer.from(signatureB64, 'base64')
    );
  } catch {
    return false;
  }
}

export function shouldSign(createdAt: Date, keyCreatedAt: Date): boolean {
  return createdAt.getTime() >= keyCreatedAt.getTime();
}
