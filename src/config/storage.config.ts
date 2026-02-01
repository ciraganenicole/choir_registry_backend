import * as fs from 'fs';
import * as path from 'path';

// Local file storage functions
export const saveFileLocally = async (file: Express.Multer.File, subfolder: string = 'reports'): Promise<string> => {
  try {
    const uploadDir = path.join('./uploads', subfolder);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanFileName = file.originalname.replace(/\s+/g, '-').toLowerCase();
    const finalFileName = `${uniqueSuffix}-${cleanFileName}`;
    const finalPath = path.join(uploadDir, finalFileName);
    
    // Move file from temp location to permanent location
    fs.renameSync(file.path, finalPath);
    
    // Return URL path (will be served as static file)
    return `/uploads/${subfolder}/${finalFileName}`;
  } catch (error) {
    throw new Error('Failed to save file locally');
  }
};
