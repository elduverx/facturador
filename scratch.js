const crypto = require('crypto');

function encrypt3DES(str, key) {
  const cipher = crypto.createCipheriv('des-ede3-cbc', key, Buffer.alloc(8, 0));
  cipher.setAutoPadding(false);
  const buf = Buffer.from(str, 'utf8');
  const padLen = 8 - (buf.length % 8);
  const paddedBuf = padLen === 8 ? buf : Buffer.concat([buf, Buffer.alloc(padLen, 0)]);
  return Buffer.concat([cipher.update(paddedBuf), cipher.final()]);
}

function mac256(str, key) {
  return crypto.createHmac('sha256', key).update(str).digest();
}

const secretKeyBase64 = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7';
const order = '123456789012';

const params = {
  DS_MERCHANT_AMOUNT: '100',
  DS_MERCHANT_ORDER: order,
  DS_MERCHANT_MERCHANTCODE: '999008881',
  DS_MERCHANT_CURRENCY: '978',
  DS_MERCHANT_TRANSACTIONTYPE: '0',
  DS_MERCHANT_TERMINAL: '1',
  DS_MERCHANT_MERCHANTURL: 'http://localhost:3000/api/payments/redsys/callback',
  DS_MERCHANT_URLOK: 'http://localhost:3000/success',
  DS_MERCHANT_URLKO: 'http://localhost:3000/error'
};

const paramsBase64 = Buffer.from(JSON.stringify(params)).toString('base64');
console.log('paramsBase64:', paramsBase64);

const merchantKey = Buffer.from(secretKeyBase64, 'base64');
const derivedKey = encrypt3DES(order, merchantKey);
console.log('derivedKey (hex):', derivedKey.toString('hex'));

const signature = mac256(paramsBase64, derivedKey).toString('base64');
console.log('signature:', signature);
