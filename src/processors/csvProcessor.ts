import { parse as parseCsv } from "csv-parse/sync";
import { stringify as csvStringify } from "csv-stringify/sync";
import fs from "fs";
import path from "path";
import { NotionWord } from "../types";
import { z } from "zod";

const CsvRecordSchema = z.object({
  Word: z.string().min(1, "Word is required"),
  Translation: z.string().optional(),
  "Example sentence": z.string().optional(),
  "Example sentence translation": z.string().optional(),
});

const CsvArraySchema = z.array(CsvRecordSchema);

interface Record {
  Word: string;
  Translation?: string;
  "Example sentence"?: string;
  "Example sentence translation"?: string;
}
export class CsvProcessor {
  static readCsv(filePath: string): NotionWord[] {
    try {
      let fileContent = fs.readFileSync(filePath, "utf-8");
      // Remove BOM character if present
      if (fileContent.charCodeAt(0) === 0xfeff) {
        fileContent = fileContent.slice(1);
      }
      const records = parseCsv<Record>(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });

      const validatedRecords = CsvArraySchema.parse(records);

      return validatedRecords.map((record) => ({
        Name: record.Word,
        Translation: record.Translation || "",
        "Example sentence": record["Example sentence"] || "",
        "Example sentence translation":
          record["Example sentence translation"] || "",
      }));
    } catch (error) {
      throw new Error(
        `Error reading CSV file: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
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
      throw new Error(
        `Error writing CSV file: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  static sanitizeWord(word: NotionWord): NotionWord {
    return {
      ...word,
      Name: this.uncapitalizeFirstLetter(word.Name.trim()),
      Translation: word.Translation
        ? this.uncapitalizeFirstLetter(word.Translation.trim())
        : "",
    };
  }

  private static uncapitalizeFirstLetter(str: string): string {
    if (!str) return str;
    return str.trim().charAt(0).toLowerCase() + str.slice(1);
  }
}
