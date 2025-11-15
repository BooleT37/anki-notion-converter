# Anki Notion Converter

A TypeScript application built with **LangChain** that converts Notion CSV exports of German vocabulary to Anki-compatible CSV files with generated images.

## Features

### Core Processing

- **CSV Processing**: Reads Notion CSV exports with German vocabulary and handles BOM characters
- **Data Sanitization**: Capitalizes word names and translations
- **Smart Translation**:
  - Uses specialized prompts for word vs. sentence translation
  - Provides alternatives for German words when appropriate
  - Auto-generates missing example sentences

### AI-Powered Enhancements

- **Content Generation**: Creates concise German example sentences when missing
- **Image Generation**: Creates contextual, word-focused images using DALL-E (no text on images)
- **German Grammar**: Automatically adds correct articles (der/die/das) and ensures proper noun capitalization
- **Linguistic Analysis**:
  - Identifies parts of speech
  - Generates plural and inflected forms
  - Creates sentences with word blanks (\*\*\*) for practice
  - Finds German alternatives for Russian translations

### Technical Features

- **LangChain Integration**: Built using LangChain framework with structured prompts
- **Parallel Processing**: Uses Promise.all() for efficient AI operations
- **Error Handling**: Robust error handling with fallbacks
- **Anki-Ready Output**: Generates complete Anki flashcard data

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment**:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your OpenAI API key:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   INPUT_CSV_PATH=./input/notion_export.csv
   OUTPUT_CSV_PATH=./output/anki_import.csv
   IMAGES_DIR=./output/images
   ```

3. **Prepare input data**:
   ```bash
   mkdir -p input
   ```
   - Add your Notion CSV export as `input/notion_export.csv`
   - Required columns: "Name", "Translation", "Example sentence", "Example sentence translation"
   - Missing translations and example sentences will be auto-generated
   - Paths in `.env` are relative to the project root directory

## Usage

### Main Processing

Run the application to process your entire CSV:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### Image Regeneration

If you want to regenerate a specific image with custom context:

```bash
npm run regenerate-image
```

This interactive script will:

1. Ask for the German word you want to regenerate
2. Ask for custom context for the image
3. Find the word in your output CSV
4. Generate a new image with your custom context
5. Update the CSV with the new image path

**Example usage:**

```
Enter the German word: Baum
Enter custom context: sunny day in a park, green leaves, no people, bright colors
```

## Input Format

Your Notion CSV should have these columns:

- **Name**: German word (articles and capitalization will be corrected)
- **Translation**: Russian translation (optional, will be generated with alternatives if missing)
- **Example sentence**: German example sentence (optional, will be generated if missing)
- **Example sentence translation**: Russian translation of example (optional, will be generated if missing)

**Note**: The application handles UTF-8 BOM characters and missing data gracefully.

## Output

The application generates a comprehensive Anki CSV with these columns:

- **German**: German word with correct article (der/die/das) and capitalization
- **Russian**: Russian translation with alternatives when applicable
- **Sample sentence**: German example sentence
- **Sample sentence without the word**: Same sentence with word replaced by "\*\*\*"
- **Sample sentence translation (rus)**: Russian translation of the example sentence
- **German Alternatives**: Other German words that translate to the Russian word
- **Plural and inflected forms**: Grammatical variations of the German word
- **Part of Speech**: Grammatical category (noun, verb, adjective, etc.)
- **imagePath**: Path to generated contextual image

**Additional Output**:

- **Images folder**: AI-generated contextual images (no text, colorful, memorable)
- **Complete vocabulary data**: All missing information filled in automatically

## Project Architecture

The application is built with a modular service-oriented architecture:

### Services

- **`CsvProcessor`**: Handles CSV reading/writing and data sanitization
- **`TranslationService`**: Manages word and text translations using LangChain ChatOpenAI
- **`ContentGenerationService`**: Generates missing example sentences
- **`AnkiEnhancementService`**: Creates Anki-specific enhancements (articles, grammar analysis, alternatives)
- **`ImageService`**: Generates contextual images using LangChain DALL-E integration

### Processing Flow

1. **Read & Sanitize**: Load CSV and clean data
2. **Generate Content**: Create missing example sentences
3. **Translate**: Add missing translations (words with alternatives, sentences)
4. **Enhance**: Generate Anki-specific data (articles, grammar, alternatives, images)
5. **Export**: Create comprehensive Anki CSV

### Key Technologies

- **LangChain**: AI workflow framework with structured prompts
- **OpenAI GPT-3.5**: Text generation and translation
- **DALL-E 3**: Image generation
- **TypeScript**: Type-safe development
- **CSV Processing**: Handles BOM characters and encoding issues

## Requirements

- Node.js 16+
- OpenAI API key
- TypeScript
- LangChain framework (included in dependencies)
