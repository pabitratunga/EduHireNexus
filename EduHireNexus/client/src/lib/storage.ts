import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  UploadTask,
  UploadTaskSnapshot,
} from "firebase/storage";
import { storage } from "./firebase";
import { toast } from "@/hooks/use-toast";

export interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
  onComplete?: (downloadURL: string) => void;
  onError?: (error: Error) => void;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  downloadURL: string;
  path: string;
  uploadedAt: Date;
}

// Storage paths
export const STORAGE_PATHS = {
  RESUMES: (uid: string) => `resumes/${uid}`,
  LOGOS: (companyId: string) => `logos/${companyId}`,
  PROOFS: (companyId: string) => `proofs/${companyId}`,
} as const;

// File type validation
export const FILE_TYPES = {
  PDF: ['application/pdf'],
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  RESUME: 5 * 1024 * 1024, // 5MB
  LOGO: 1 * 1024 * 1024, // 1MB
  PROOF: 5 * 1024 * 1024, // 5MB
} as const;

// Validate file before upload
export function validateFile(
  file: File,
  options: Pick<FileUploadOptions, 'maxSize' | 'allowedTypes'>
): { valid: boolean; error?: string } {
  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
}

// Generate unique filename
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${randomString}.${extension}`;
}

// Upload file with progress tracking
export async function uploadFile(
  file: File,
  path: string,
  options: FileUploadOptions = {}
): Promise<UploadedFile> {
  try {
    // Validate file
    const validation = validateFile(file, {
      maxSize: options.maxSize,
      allowedTypes: options.allowedTypes,
    });

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name);
    const fullPath = `${path}/${filename}`;
    const storageRef = ref(storage, fullPath);

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          options.onProgress?.(progress);
        },
        (error) => {
          const errorMessage = getStorageErrorMessage(error);
          toast({
            title: "Upload Failed",
            description: errorMessage,
            variant: "destructive",
          });
          options.onError?.(error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const metadata = await getMetadata(storageRef);
            
            const uploadedFile: UploadedFile = {
              name: file.name,
              size: file.size,
              type: file.type,
              downloadURL,
              path: fullPath,
              uploadedAt: new Date(metadata.timeCreated),
            };

            options.onComplete?.(downloadURL);
            toast({
              title: "Upload Successful",
              description: `${file.name} has been uploaded successfully`,
              variant: "default",
            });
            
            resolve(uploadedFile);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    toast({
      title: "Upload Failed",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
}

// Upload resume
export async function uploadResume(
  file: File,
  uid: string,
  options: Omit<FileUploadOptions, 'maxSize' | 'allowedTypes'> = {}
): Promise<UploadedFile> {
  return uploadFile(file, STORAGE_PATHS.RESUMES(uid), {
    ...options,
    maxSize: FILE_SIZE_LIMITS.RESUME,
    allowedTypes: [...FILE_TYPES.PDF],
  });
}

// Upload company logo
export async function uploadLogo(
  file: File,
  companyId: string,
  options: Omit<FileUploadOptions, 'maxSize' | 'allowedTypes'> = {}
): Promise<UploadedFile> {
  return uploadFile(file, STORAGE_PATHS.LOGOS(companyId), {
    ...options,
    maxSize: FILE_SIZE_LIMITS.LOGO,
    allowedTypes: [...FILE_TYPES.IMAGES],
  });
}

// Upload company proof document
export async function uploadProofDocument(
  file: File,
  companyId: string,
  options: Omit<FileUploadOptions, 'maxSize' | 'allowedTypes'> = {}
): Promise<UploadedFile> {
  return uploadFile(file, STORAGE_PATHS.PROOFS(companyId), {
    ...options,
    maxSize: FILE_SIZE_LIMITS.PROOF,
    allowedTypes: [...FILE_TYPES.PDF],
  });
}

// Delete file
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    
    toast({
      title: "File Deleted",
      description: "File has been deleted successfully",
      variant: "default",
    });
  } catch (error) {
    const errorMessage = getStorageErrorMessage(error);
    toast({
      title: "Delete Failed",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
}

// List files in directory
export async function listFiles(path: string): Promise<UploadedFile[]> {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    
    const files = await Promise.all(
      result.items.map(async (itemRef) => {
        const [downloadURL, metadata] = await Promise.all([
          getDownloadURL(itemRef),
          getMetadata(itemRef),
        ]);
        
        return {
          name: itemRef.name,
          size: metadata.size,
          type: metadata.contentType || 'unknown',
          downloadURL,
          path: itemRef.fullPath,
          uploadedAt: new Date(metadata.timeCreated),
        };
      })
    );
    
    return files;
  } catch (error) {
    const errorMessage = getStorageErrorMessage(error);
    toast({
      title: "Failed to List Files",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
}

// Get user's resumes
export async function getUserResumes(uid: string): Promise<UploadedFile[]> {
  return listFiles(STORAGE_PATHS.RESUMES(uid));
}

// Get company's proof documents
export async function getCompanyProofs(companyId: string): Promise<UploadedFile[]> {
  return listFiles(STORAGE_PATHS.PROOFS(companyId));
}

// Get storage error message
function getStorageErrorMessage(error: any): string {
  if (error.code) {
    switch (error.code) {
      case 'storage/object-not-found':
        return 'File not found';
      case 'storage/unauthorized':
        return 'Unauthorized access to file';
      case 'storage/canceled':
        return 'Upload was canceled';
      case 'storage/unknown':
        return 'Unknown error occurred';
      case 'storage/invalid-format':
        return 'Invalid file format';
      case 'storage/invalid-event-name':
        return 'Invalid event name';
      case 'storage/invalid-url':
        return 'Invalid URL';
      case 'storage/invalid-argument':
        return 'Invalid argument';
      case 'storage/no-default-bucket':
        return 'No default bucket configured';
      case 'storage/cannot-slice-blob':
        return 'Cannot process file';
      case 'storage/server-file-wrong-size':
        return 'File size mismatch';
      default:
        return error.message || 'Storage error occurred';
    }
  }
  
  return error.message || 'Storage error occurred';
}

// Helper to create file input change handler
export function createFileUploadHandler(
  uploadFunction: (file: File) => Promise<UploadedFile>,
  onSuccess?: (file: UploadedFile) => void,
  onError?: (error: Error) => void
) {
  return async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadedFile = await uploadFunction(file);
      onSuccess?.(uploadedFile);
    } catch (error) {
      onError?.(error as Error);
    }
  };
}
