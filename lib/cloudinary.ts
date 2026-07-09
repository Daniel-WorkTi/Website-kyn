import { v2 as cloudinary } from "cloudinary";

export const CLOUDINARY_FOLDER = "proimagem";

export function isCloudinaryConfigured(): boolean {
  return Boolean(process.env.CLOUDINARY_URL);
}

export function configureCloudinary() {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("CLOUDINARY_URL não configurado.");
  }

  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
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
  const cld = configureCloudinary();
  const config = cld.config();

  const apiSecret = config.api_secret;
  const apiKey = config.api_key;
  const cloudName = config.cloud_name;

  if (!apiSecret || !apiKey || !cloudName) {
    throw new Error("CLOUDINARY_URL inválido ou incompleto.");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(params, apiSecret);

  return {
    signature,
    timestamp,
    api_key: apiKey,
    cloud_name: cloudName,
    folder
  };
}
