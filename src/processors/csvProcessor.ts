import { parse as parseCsv, stringify as stringifyCsv } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path';
import { NotionWord } from '../types';

export class CsvProcessor {
  static readCsv(filePath: string): NotionWord[] {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const records = parseCsv(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });
      
      return records.map((record: any) => ({
        Name: record.Name,
        Translation: record.Translation,
        'Example sentence': record['Example sentence'],
        'Example sentence translation': record['Example sentence translation']
      }));
    } catch (error) {
      throw new Error(`Error reading CSV file: ${error.message}`);
    }
  }

  static writeCsv(filePath: string, data: any[]): void {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const csvContent = csvStringify(data, { header: true });
      fs.writeFileSync(filePath, csvContent);
    } catch (error) {
      throw new Error(`Error writing CSV file: ${error.message}`);
    }
  }

  static sanitizeWord(word: NotionWord): NotionWord {
    return {
      ...word,
      Name: this.capitalizeFirstLetter(word.Name.trim()),
      Translation: word.Translation ? this.capitalizeFirstLetter(word.Translation.trim()) : ''
    };
  }

  private static capitalizeFirstLetter(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
