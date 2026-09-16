import "server-only"

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const algorithm = "aes-256-gcm"

function encryptionKey() {
  const value = process.env.PATREON_TOKEN_ENCRYPTION_KEY
  if (!value) {
    throw new Error("PATREON_TOKEN_ENCRYPTION_KEY is not configured.")
  }

  const key = Buffer.from(value, "base64")
  if (key.length !== 32) {
    throw new Error("PATREON_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.")
  }

  return key
}

export function encryptPatreonCredential(value: string, userId: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(algorithm, encryptionKey(), iv)
  cipher.setAAD(Buffer.from(userId))
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()

  return Buffer.concat([iv, tag, encrypted]).toString("base64")
}

export function decryptPatreonCredential(value: string, userId: string) {
  const payload = Buffer.from(value, "base64")
  const iv = payload.subarray(0, 12)
  const tag = payload.subarray(12, 28)
  const encrypted = payload.subarray(28)
  const decipher = createDecipheriv(algorithm, encryptionKey(), iv)
  decipher.setAAD(Buffer.from(userId))
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8"
  )
}
