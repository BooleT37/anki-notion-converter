# Anki Notion Converter

A TypeScript application that converts Notion CSV exports of German vocabulary to Anki-compatible CSV files with generated images.

## Features

- **CSV Processing**: Reads Notion CSV exports with German vocabulary
- **Data Sanitization**: Capitalizes word names and translations
- **Auto-Translation**: Uses OpenAI to translate missing German words to Russian
- **Image Generation**: Creates contextual images for each word using DALL-E
- **Anki Export**: Generates Anki-compatible CSV files

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
   - Create an `input` directory
   - Add your Notion CSV export with columns: "Name", "Translation", "Example sentence", "Example sentence translation"

## Usage

Run the application:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Input Format

Your Notion CSV should have these columns:
- **Name**: German word
- **Translation**: Russian translation (optional, will be generated if missing)
- **Example sentence**: German example sentence
- **Example sentence translation**: Russian translation of example (optional, will be generated if missing)

## Output

The application generates:
- **Anki CSV file**: Ready to import into Anki
- **Images folder**: Generated images for each word
- **Processed data**: Sanitized and translated vocabulary

## Requirements

- Node.js 16+
- OpenAI API key
- TypeScript
