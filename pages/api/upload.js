import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { imageProcessingService } from '../../lib/imageProcessing';
import formidable from 'formidable';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxFiles: 10
    });

    const [fields, files] = await form.parse(req);
    const uploadType = fields.type?.[0] || 'listing'; // listing, avatar, message
    const uploadedFiles = Array.isArray(files.images) ? files.images : [files.images].filter(Boolean);

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];

    for (const file of uploadedFiles) {
      try {
        // Read file buffer
        const buffer = fs.readFileSync(file.filepath);
        
        // Validate image
        const validationErrors = imageProcessingService.validateImage({
          type: file.mimetype,
          size: file.size
        });
        
        if (validationErrors.length > 0) {
          results.push({
            error: validationErrors.join(', '),
            filename: file.originalFilename
          });
          continue;
        }

        // Generate image sizes
        const imageSizes = await imageProcessingService.generateImageSizes(buffer);
        const imageId = uuidv4();
        const urls = {};

        // Upload each size to Supabase storage
        for (const [sizeName, processedBuffer] of Object.entries(imageSizes)) {
          const fileName = `${uploadType}/${user.id}/${imageId}_${sizeName}.jpg`;
          
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, processedBuffer, {
              contentType: 'image/jpeg',
              upsert: false
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);

          urls[sizeName] = publicUrl;
        }

        results.push({
          success: true,
          filename: file.originalFilename,
          imageId,
          urls
        });

        // Clean up temp file
        fs.unlinkSync(file.filepath);

      } catch (error) {
        console.error('Error processing file:', error);
        results.push({
          error: 'Failed to process image',
          filename: file.originalFilename
        });
      }
    }

    return res.status(200).json({ results });

  } catch (error) {
    console.error('Upload API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
