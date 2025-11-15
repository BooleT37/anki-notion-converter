export interface NotionWord {
  Name: string;
  Translation: string;
  "Example sentence": string;
  "Example sentence translation": string;
}

export interface AnkiWord {
  German: string;
  Russian: string;
  "Sample sentence": string;
  "Sample sentence without the word": string;
  "Sample sentence translation (rus)": string;
  "German Alternatives": string;
  "Plural and inflected forms": string;
  "Part of Speech": string;
  imagePath?: string;
}

export interface ProcessedWord extends NotionWord {
  processed: boolean;
  error?: string;
}
