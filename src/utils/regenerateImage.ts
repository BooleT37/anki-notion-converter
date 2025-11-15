import dotenv from "dotenv";
import { ImageService } from "../services/imageService";
import { CsvProcessor } from "../processors/csvProcessor";
import { AnkiWord } from "../types";
import * as readline from "readline";
import path from "path";
import fs from "fs";

dotenv.config();

class ImageRegenerator {
  private imageService: ImageService;
  private outputPath: string;
  private imagesDir: string;
  private rl: readline.Interface;

  constructor() {
    const { OPENAI_API_KEY, OUTPUT_CSV_PATH, IMAGES_DIR } = process.env;

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required in .env file");
    }

    if (!OUTPUT_CSV_PATH) {
      throw new Error("OUTPUT_CSV_PATH is required in .env file");
    }
    if (!IMAGES_DIR) {
      throw new Error("IMAGES_DIR is required in .env file");
    }
    this.outputPath = OUTPUT_CSV_PATH;
    this.imagesDir = IMAGES_DIR;

    this.imageService = new ImageService(OPENAI_API_KEY, this.imagesDir);

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private async askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private findWordInCsv(word: string): AnkiWord | null {
    try {
      if (!fs.existsSync(this.outputPath)) {
        console.error(`❌ Output file not found: ${this.outputPath}`);
        return null;
      }

      // Read the Anki CSV file directly (not using CsvProcessor which expects Notion format)
      let fileContent = fs.readFileSync(this.outputPath, "utf-8");

      // Remove BOM character if present
      if (fileContent.charCodeAt(0) === 0xfeff) {
        fileContent = fileContent.slice(1);
      }

      const { parse } = require("csv-parse/sync");
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });

      // Search for the word (case-insensitive, with or without articles)
      const foundWord = records.find((w: any) => {
        if (!w || !w.German) return false;

        const germanWord = w.German.toLowerCase();
        const searchWord = word.toLowerCase();

        // Match exact word or word without article
        return (
          germanWord === searchWord ||
          germanWord.includes(searchWord) ||
          germanWord.replace(/^(der|die|das)\s+/i, "") === searchWord
        );
      });

      return foundWord || null;
    } catch (error) {
      console.error("Error reading CSV file:", error);
      return null;
    }
  }

  private createEnhancedPrompt(
    word: string,
    originalSentence: string,
    customContext: string
  ): string {
    let prompt = `I am creating Anki cards to remember German words. Please help me create an image for the German word "${word}".`;

    if (originalSentence) {
      prompt += ` Context from example sentence: ${originalSentence}.`;
    }

    if (customContext) {
      prompt += ` Additional context: ${customContext}.`;
    }

    prompt +=
      " The image should be simple, colorful, easy to remember and associate with the word. VERY IMPORTANT: The image SHOULD NOT have ANY WORDS or TEXT in it, especially not the keyword itself.";

    return prompt;
  }

  private updateCsvWithNewImage(word: AnkiWord, newImagePath: string): void {
    try {
      // Read the Anki CSV file directly
      let fileContent = fs.readFileSync(this.outputPath, "utf-8");

      // Remove BOM character if present
      if (fileContent.charCodeAt(0) === 0xfeff) {
        fileContent = fileContent.slice(1);
      }

      const { parse } = require("csv-parse/sync");
      const { stringify } = require("csv-stringify/sync");

      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });

      // Find and update the word
      const wordIndex = records.findIndex((w: any) => w.German === word.German);
      if (wordIndex !== -1 && records[wordIndex]) {
        records[wordIndex].imagePath = newImagePath
          ? path.relative(path.dirname(this.outputPath), newImagePath)
          : "";

        // Write back to CSV
        const csvContent = stringify(records, { header: true });
        fs.writeFileSync(this.outputPath, csvContent);
        console.log(`✅ Updated CSV with new image path`);
      }
    } catch (error) {
      console.error("Error updating CSV:", error);
    }
  }

  async regenerateImage(): Promise<void> {
    try {
      console.log("🎨 Image Regeneration Tool\n");

      const word = await this.askQuestion(
        "Enter the German word to regenerate image for: "
      );

      if (!word.trim()) {
        console.log("❌ No word provided. Exiting.");
        return;
      }

      console.log(`\n🔍 Searching for "${word}" in the output file...`);

      const foundWord = this.findWordInCsv(word);

      if (!foundWord) {
        console.log(`❌ Word "${word}" not found in the output file.`);
        console.log(
          "Make sure you've run the main processing first and the word exists in the CSV."
        );
        return;
      }

      console.log(`✅ Found word: ${foundWord.German}`);
      console.log(`   Translation: ${foundWord.Russian}`);
      console.log(`   Example: ${foundWord["Sample sentence"]}`);

      const customContext = await this.askQuestion(
        "\nEnter custom context for the image (optional): "
      );

      console.log(`\n🎨 Generating new image...`);

      const enhancedPrompt = this.createEnhancedPrompt(
        foundWord.German,
        foundWord["Sample sentence"],
        customContext
      );

      console.log(`📝 Using prompt: ${enhancedPrompt}`);

      const newImagePath = await this.imageService.generateImage(
        foundWord.German,
        enhancedPrompt
      );

      if (newImagePath) {
        console.log(`✅ New image generated: ${newImagePath}`);

        // Update the CSV with the new image path
        this.updateCsvWithNewImage(foundWord, newImagePath);

        console.log(`🎉 Image regeneration complete!`);
      } else {
        console.log(`❌ Failed to generate new image`);
      }
    } catch (error) {
      console.error("Error during image regeneration:", error);
    } finally {
      this.rl.close();
    }
  }
}

async function main() {
  const regenerator = new ImageRegenerator();
  await regenerator.regenerateImage();
}

main().catch(console.error);
