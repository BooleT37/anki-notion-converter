export interface NotionWord {
  Name: string;
  Translation: string;
  'Example sentence': string;
  'Example sentence translation': string;
}

export interface AnkiWord extends NotionWord {
  // Additional fields will be added later as per requirements
  imagePath?: string;
  // Add more Anki-specific fields here
}

export interface ProcessedWord extends NotionWord {
  processed: boolean;
  error?: string;
}
