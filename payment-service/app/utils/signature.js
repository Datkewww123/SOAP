const crypto = require('crypto');

function createSignature(rawSignature, secretKey) {
  return crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');
}

function verifyMoMoSignature(params, secretKey) {
  const receivedSignature = params.signature;
  delete params.signature;

  const sortedKeys = Object.keys(params).sort();
  const rawSignature = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const expectedSignature = createSignature(rawSignature, secretKey);
  return expectedSignature === receivedSignature;
}

module.exports = { createSignature, verifyMoMoSignature };
