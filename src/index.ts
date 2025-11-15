import dotenv from "dotenv";
import { CsvProcessor } from "./processors/csvProcessor";
import { TranslationService } from "./services/translationService";
import { ContentGenerationService } from "./services/contentGenerationService";
import { AnkiEnhancementService } from "./services/ankiEnhancementService";
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

    const outputPath = OUTPUT_CSV_PATH;
    const imagesDir = IMAGES_DIR;

    if (!outputPath) {
      throw new Error("OUTPUT_CSV_PATH is required in .env file");
    }
    if (!imagesDir) {
      throw new Error("IMAGES_DIR is required in .env file");
    }

    console.log("Reading and processing CSV file...");
    const words = CsvProcessor.readCsv(INPUT_CSV_PATH);
    console.log(`Found ${words.length} words to process`);

    const translationService = new TranslationService(OPENAI_API_KEY);
    const contentGenerationService = new ContentGenerationService(
      OPENAI_API_KEY
    );
    const ankiEnhancementService = new AnkiEnhancementService(OPENAI_API_KEY);
    const imageService = new ImageService(OPENAI_API_KEY, imagesDir);

    const processedWords: AnkiWord[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;

      console.log(`\nProcessing word ${i + 1}/${words.length}: ${word.Name}`);

      try {
        // Sanitize the word
        const sanitizedWord = CsvProcessor.sanitizeWord(word);

        // Generate example sentence if missing
        if (!sanitizedWord["Example sentence"] && sanitizedWord.Name) {
          sanitizedWord["Example sentence"] =
            await contentGenerationService.generateExampleSentence(
              sanitizedWord.Name,
              SOURCE_LANGUAGE
            );
        }

        // Ensure translations exist
        const translatedWord = await translationService.ensureTranslation(
          sanitizedWord,
          TARGET_LANGUAGE,
          SOURCE_LANGUAGE
        );

        // Generate image
        const imagePath = await imageService.generateImage(
          translatedWord.Name,
          translatedWord["Example sentence"]
        );

        // Generate Anki-specific enhancements
        const [
          sentenceWithoutWord,
          germanAlternatives,
          pluralForms,
          partOfSpeech,
          wordWithArticle,
        ] = await Promise.all([
          ankiEnhancementService.createSentenceWithoutWord(
            translatedWord["Example sentence"],
            translatedWord.Name
          ),
          ankiEnhancementService.generateGermanAlternatives(
            translatedWord.Translation
          ),
          ankiEnhancementService.generatePluralAndInflectedForms(
            translatedWord.Name
          ),
          ankiEnhancementService.identifyPartOfSpeech(translatedWord.Name),
          ankiEnhancementService.addArticleIfNeeded(translatedWord.Name),
        ]);

        // Create Anki word with all required fields
        const ankiWord: AnkiWord = {
          German: wordWithArticle,
          Russian: translatedWord.Translation,
          "Sample sentence": translatedWord["Example sentence"],
          "Sample sentence without the word": sentenceWithoutWord,
          "Sample sentence translation (rus)":
            translatedWord["Example sentence translation"],
          "German Alternatives": germanAlternatives,
          "Plural and inflected forms": pluralForms,
          "Part of Speech": partOfSpeech,
          imagePath: imagePath
            ? path.relative(path.dirname(outputPath), imagePath)
            : "",
        };

        processedWords.push(ankiWord);
        console.log(`✅ Processed: ${word.Name}`);
      } catch (error: unknown) {
        console.error(
          `❌ Error processing word "${word.Name}":`,
          error instanceof Error ? error.message : String(error)
        );
        throw error;
      }
    }

    // Write the processed words to the output CSV
    CsvProcessor.writeCsv(outputPath, processedWords);
    console.log(`\n✅ Processing complete! Output written to ${outputPath}`);
    console.log(`Images saved to: ${path.resolve(imagesDir)}`);
  } catch (error) {
    console.error(
      "Error in main process:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
