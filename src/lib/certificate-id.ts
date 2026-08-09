// Unambiguous charset: no 0/O/1/I so codes stay easy to read/type by hand.
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomFrom(charset: string, length: number) {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

/** Public, permanent identifier for a certificate, e.g. CERT-7F4A92D81C. */
export function generateCertificateId() {
  return `CERT-${randomFrom(ID_CHARS, 10)}`
}

/** Single-use redemption code for a claim-code certificate, e.g. AB3D-9KLM. */
export function generateClaimCode() {
  return `${randomFrom(ID_CHARS, 4)}-${randomFrom(ID_CHARS, 4)}`
}
