import { v2 as cloudinary } from "cloudinary";

export const CLOUDINARY_FOLDER = "proimagem";

type CloudinaryCredentials = {
  cloud_name: string;
  api_key: string;
  api_secret: string;
};

function parseCloudinaryEnv(): CloudinaryCredentials {
  const raw = process.env.CLOUDINARY_URL?.trim();
  if (!raw) {
    throw new Error("CLOUDINARY_URL não configurado.");
  }

  const normalized = raw.startsWith("cloudinary://") ? raw : `cloudinary://${raw}`;
  const parsed = new URL(normalized.replace("cloudinary://", "https://"));
  const api_key = decodeURIComponent(parsed.username);
  const api_secret = decodeURIComponent(parsed.password);
  const cloud_name = parsed.hostname;

  if (!api_key || !api_secret || !cloud_name) {
    throw new Error("CLOUDINARY_URL inválido ou incompleto.");
  }

  return { cloud_name, api_key, api_secret };
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(process.env.CLOUDINARY_URL?.trim());
}

export function configureCloudinary() {
  const credentials = parseCloudinaryEnv();
  cloudinary.config({
    ...credentials,
    secure: true
  });
  return cloudinary;
}

export type SignedUpload = {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
};

export function signUpload(folder = CLOUDINARY_FOLDER): SignedUpload {
  const credentials = parseCloudinaryEnv();
  const cld = configureCloudinary();

  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder };
  const signature = cld.utils.api_sign_request(params, credentials.api_secret);

  return {
    signature,
    timestamp,
    api_key: credentials.api_key,
    cloud_name: credentials.cloud_name,
    folder
  };
}
