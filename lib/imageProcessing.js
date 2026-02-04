import sharp from 'sharp';

export const imageProcessingService = {
  // Image size configurations
  sizes: {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 800, height: 600 },
    large: { width: 2048, height: 2048 }
  },

  // Process and resize image
  async processImage(buffer, size = 'medium') {
    try {
      const config = this.sizes[size];
      if (!config) {
        throw new Error(`Invalid size: ${size}`);
      }

      const processedImage = await sharp(buffer)
        .resize(config.width, config.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 85,
          progressive: true
        })
        .toBuffer();

      return processedImage;
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('Failed to process image');
    }
  },

  // Generate multiple sizes from single upload
  async generateImageSizes(buffer) {
    try {
      const results = {};
      
      for (const [sizeName, config] of Object.entries(this.sizes)) {
        results[sizeName] = await this.processImage(buffer, sizeName);
      }
      
      return results;
    } catch (error) {
      console.error('Error generating image sizes:', error);
      throw error;
    }
  },

  // Validate image file
  validateImage(file) {
    const errors = [];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push('File must be an image');
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      errors.push('Image must be less than 5MB');
    }
    
    // Check supported formats
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedFormats.includes(file.type)) {
      errors.push('Supported formats: JPEG, PNG, WebP');
    }
    
    return errors;
  },

  // Get image metadata
  async getImageMetadata(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size
      };
    } catch (error) {
      console.error('Error getting image metadata:', error);
      throw error;
    }
  }
};
