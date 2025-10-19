import dotenv from "dotenv";
import { CsvProcessor } from "./processors/csvProcessor";
import { TranslationService } from "./services/translationService";
import { ImageService } from "./services/imageService";
import { NotionWord, AnkiWord } from "./types";
import path from "path";

dotenv.config();

async function main() {
  try {
    const {
      OPENAI_API_KEY,
      INPUT_CSV_PATH,
      OUTPUT_CSV_PATH,
      IMAGES_DIR = "./output/images",
      SOURCE_LANGUAGE = "German",
      TARGET_LANGUAGE = "Russian",
    } = process.env;

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required in .env file");
    }

    if (!INPUT_CSV_PATH) {
      throw new Error("INPUT_CSV_PATH is required in .env file");
    }

    const outputPath = OUTPUT_CSV_PATH || "./output/anki_import.csv";
    const imagesDir = IMAGES_DIR;

    console.log("Reading and processing CSV file...");
    const words = CsvProcessor.readCsv(INPUT_CSV_PATH);
    console.log(`Found ${words.length} words to process`);

    const translationService = new TranslationService(OPENAI_API_KEY);
    const imageService = new ImageService(OPENAI_API_KEY, imagesDir);

    const processedWords: AnkiWord[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      console.log(`\nProcessing word ${i + 1}/${words.length}: ${word.Name}`);

      try {
        // Sanitize the word
        const sanitizedWord = CsvProcessor.sanitizeWord(word);

        // Ensure translations exist
        const translatedWord = await translationService.ensureTranslation(
          sanitizedWord,
          TARGET_LANGUAGE
        );

        // Generate image
        const imagePath = await imageService.generateImage(
          translatedWord.Name,
          translatedWord["Example sentence"]
        );

        // Create Anki word with additional fields
        const ankiWord: AnkiWord = {
          ...translatedWord,
          imagePath: imagePath
            ? path.relative(path.dirname(outputPath), imagePath)
            : "",
          // Add more Anki-specific fields here as needed
        };

        processedWords.push(ankiWord);
        console.log(`✅ Processed: ${word.Name}`);
      } catch (error) {
        console.error(
          `❌ Error processing word "${word.Name}":`,
          error.message
        );
      }
    }

    // Write the processed words to the output CSV
    CsvProcessor.writeCsv(outputPath, processedWords);
    console.log(`\n✅ Processing complete! Output written to ${outputPath}`);
    console.log(`Images saved to: ${path.resolve(imagesDir)}`);
  } catch (error) {
    console.error("Error in main process:", error);
    process.exit(1);
  }
}

main();
