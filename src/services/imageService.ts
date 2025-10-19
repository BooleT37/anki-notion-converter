import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

export class ImageService {
  private openai: OpenAI;
  private imagesDir: string;

  constructor(apiKey: string, imagesDir: string) {
    this.openai = new OpenAI({ apiKey });
    this.imagesDir = imagesDir;
    
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

  async generateImage(word: string, context: string): Promise<string | null> {
    try {
      const prompt = `A clear, high-quality image representing the German word "${word}". ${context ? `Context: ${context}` : ''} The image should be simple, clear, and focused on the main concept of the word.`;
      
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      const imageUrl = response.data[0].url;
      if (!imageUrl) return null;

      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      const filename = `${Date.now()}_${word.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      const filePath = path.join(this.imagesDir, filename);
      
      fs.writeFileSync(filePath, Buffer.from(imageBuffer));
      return filePath;
      
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  }
}
