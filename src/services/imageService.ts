import { DallEAPIWrapper } from "@langchain/openai";
import fs from "fs";
import path from "path";

const TODAY = new Date();
export class ImageService {
  private dalleWrapper: DallEAPIWrapper;
  private imagesDir: string;

  constructor(apiKey: string, imagesDir: string) {
    this.dalleWrapper = new DallEAPIWrapper({
      model: "dall-e-3",
      n: 1,
      size: "1024x1024",
      quality: "standard",
      apiKey,
    });
    this.imagesDir = path.join(
      imagesDir,
      `${TODAY.getFullYear()}-${(TODAY.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${TODAY.getDate().toString().padStart(2, "0")}`
    );

    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

  async generateImage(word: string, context: string): Promise<string | null> {
    try {
      const prompt = `I am creating Anki cards to remember German words. Please help me create images for them. The word is: "${word}". ${
        context ? `Context: ${context}` : ""
      } They should be simple colorful drawings, easy to remember and associate the word with. The people on the pictures should have European appearance. And they SHOULD NOT (VERY IMPORTANT) have ANY WORDS in them, ESPECIALLY the keyword.`;

      const imageUrl = await this.dalleWrapper.invoke(prompt);
      if (!imageUrl) return null;

      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();

      const filename = `${Date.now()}_${word.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}.png`;
      const filePath = path.join(this.imagesDir, filename);

      fs.writeFileSync(filePath, Buffer.from(imageBuffer));
      return filePath;
    } catch (error) {
      console.error("Error generating image:", error);
      return null;
    }
  }
}
