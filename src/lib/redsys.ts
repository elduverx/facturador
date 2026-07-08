import crypto from 'crypto';

export interface RedsysConfig {
  merchantCode: string;
  terminal: string;
  secretKey: string;
  url: string;
  merchantName: string;
  callbackUrl: string;
  successUrl: string;
  errorUrl: string;
}

export const REDSYS_CONFIG: RedsysConfig = {
  merchantCode: process.env.REDSYS_MERCHANT_CODE || '999008881',
  terminal: process.env.REDSYS_TERMINAL || '1',
  secretKey: process.env.REDSYS_SIGNATURE_KEY || process.env.REDSYS_SECRET_KEY || 'sq7HjrUOBfKmC576ILgskD5srU870gJ7',
  url: process.env.REDSYS_URL || (process.env.REDSYS_ENV === 'production' ? 'https://sis.redsys.es/sis/realizarPago' : 'https://sis-t.redsys.es:25443/sis/realizarPago'),
  merchantName: process.env.REDSYS_MERCHANT_NAME || 'Abogados PV',
  callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/redsys/callback`,
  successUrl: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal?payment=success`,
  errorUrl: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal?payment=error`,
};

export type RedsysCallbackParams = {
  responseCode: number;
  orderId: string;
  amountCents: number;
  currency: string;
  merchantCode: string;
  terminal: string;
  raw: Record<string, unknown>;
};

export function amountToCents(amount: number) {
  return Math.round(amount * 100);
}

export function createRedsysOrderId() {
  const firstFourDigits = crypto.randomInt(0, 10000).toString().padStart(4, '0');
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${firstFourDigits}${suffix}`;
}

function encrypt3DES(str: string, key: Buffer): Buffer {
  const cipher = crypto.createCipheriv('des-ede3-cbc', key, Buffer.alloc(8, 0));
  cipher.setAutoPadding(false);
  // Pad with zeros to 8 byte block size if needed
  const buf = Buffer.from(str, 'utf8');
  const padLen = 8 - (buf.length % 8);
  const paddedBuf = padLen === 8 ? buf : Buffer.concat([buf, Buffer.alloc(padLen, 0)]);
  return Buffer.concat([cipher.update(paddedBuf), cipher.final()]);
}

function mac256(str: string, key: Buffer): Buffer {
  return crypto.createHmac('sha256', key).update(str).digest();
}

export function createRedsysPayment(
  order: string,
  amount: number,
  description: string,
  urls?: { successUrl?: string; errorUrl?: string }
) {
  // Redsys amount is in cents
  const amountCents = amountToCents(amount).toString();

  const params = {
    DS_MERCHANT_AMOUNT: amountCents,
    DS_MERCHANT_ORDER: order,
    DS_MERCHANT_MERCHANTCODE: REDSYS_CONFIG.merchantCode,
    DS_MERCHANT_CURRENCY: '978', // EUR
    DS_MERCHANT_TRANSACTIONTYPE: '0',
    DS_MERCHANT_TERMINAL: REDSYS_CONFIG.terminal,
    DS_MERCHANT_MERCHANTURL: REDSYS_CONFIG.callbackUrl,
    DS_MERCHANT_URLOK: urls?.successUrl || REDSYS_CONFIG.successUrl,
    DS_MERCHANT_URLKO: urls?.errorUrl || REDSYS_CONFIG.errorUrl,
    DS_MERCHANT_PRODUCTDESCRIPTION: description.substring(0, 125),
    DS_MERCHANT_MERCHANTNAME: REDSYS_CONFIG.merchantName,
  };

  const paramsBase64 = Buffer.from(JSON.stringify(params)).toString('base64');

  // Key derivation
  const merchantKey = Buffer.from(REDSYS_CONFIG.secretKey, 'base64');
  const derivedKey = encrypt3DES(order, merchantKey);

  // HMAC SHA256
  const signature = mac256(paramsBase64, derivedKey).toString('base64');

  return {
    url: REDSYS_CONFIG.url,
    params: paramsBase64,
    signature: signature,
    signatureVersion: 'HMAC_SHA256_V1',
  };
}

export function verifyRedsysSignature(paramsBase64: string, signature: string) {
  try {
    // Redsys sends base64url encoded params
    const base64Str = paramsBase64.replace(/-/g, '+').replace(/_/g, '/');
    const params = JSON.parse(Buffer.from(base64Str, 'base64').toString('utf8'));
    const order = params.Ds_Order || params.DS_MERCHANT_ORDER;

    const merchantKey = Buffer.from(REDSYS_CONFIG.secretKey, 'base64');
    const derivedKey = encrypt3DES(order, merchantKey);
    
    // Compute expected signature using the raw paramsBase64 string as received
    const expectedSignature = mac256(paramsBase64, derivedKey).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    
    // Redsys uses URL safe base64 in responses sometimes, but let's be flexible
    const normalizedSignature = signature.replace(/\+/g, '-').replace(/\//g, '_');

    return expectedSignature === normalizedSignature;
  } catch (e) {
    return false;
  }
}

export function parseRedsysCallbackParams(paramsBase64: string): RedsysCallbackParams {
  const base64Str = paramsBase64.replace(/-/g, '+').replace(/_/g, '/');
  const raw = JSON.parse(Buffer.from(base64Str, 'base64').toString('utf8')) as Record<string, unknown>;
  const getString = (...keys: string[]) => {
    for (const key of keys) {
      const value = raw[key];
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
    }
    return '';
  };

  return {
    responseCode: parseInt(getString('Ds_Response', 'DS_RESPONSE'), 10),
    orderId: getString('Ds_Order', 'DS_MERCHANT_ORDER'),
    amountCents: parseInt(getString('Ds_Amount', 'DS_MERCHANT_AMOUNT'), 10),
    currency: getString('Ds_Currency', 'DS_MERCHANT_CURRENCY'),
    merchantCode: getString('Ds_MerchantCode', 'DS_MERCHANT_MERCHANTCODE'),
    terminal: getString('Ds_Terminal', 'DS_MERCHANT_TERMINAL'),
    raw,
  };
}

export function isAuthorizedRedsysResponse(responseCode: number) {
  return Number.isInteger(responseCode) && responseCode >= 0 && responseCode <= 99;
}

export function normalizeRedsysTerminal(terminal: string) {
  return String(Number(terminal || '0'));
}
