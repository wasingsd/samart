import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "รองรับเฉพาะไฟล์ PNG, JPEG, WebP เท่านั้น";
  }
  if (file.size > MAX_FILE_SIZE) {
    return `ไฟล์ใหญ่เกิน ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }
  return null;
}

/**
 * Upload image to Firebase Storage
 * @param file File to upload
 * @param path Storage path, e.g. "shops/{shopId}/menu/{itemId}"
 */
export async function uploadImage(file: File, path: string): Promise<UploadResult> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
  });
  const url = await getDownloadURL(snapshot.ref);
  return { url, path };
}
