import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { NotionWord } from "../types";

export class TranslationService {
  private chatModel: ChatOpenAI;
  private textTranslationPrompt: ChatPromptTemplate;
  private wordTranslationPrompt: ChatPromptTemplate;

  constructor(apiKey: string) {
    this.chatModel = new ChatOpenAI({
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      apiKey,
    });

    this.textTranslationPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a professional translator. Translate the following text from {sourceLanguage} to {targetLanguage}. If the text contains the word {originalWord}, translate it using the following word(s): {translations}. Only return the translation, nothing else.",
      ],
      ["user", "{text}"],
    ]);

    this.wordTranslationPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        'You are a professional translator specializing in single word translations from {sourceLanguage} to {targetLanguage}. If the word has close alternatives or synonyms in {targetLanguage}, provide them separated by commas. Limit the number of alternatives to 5. However, if the word has only one clear, direct translation with no meaningful alternatives (like "Tisch" which can only be "Стол"), provide only that single translation. Only return the translation(s), nothing else.',
      ],
      ["user", "{word}"],
    ]);
  }

  async translateText(
    text: string,
    targetLanguage: string,
    originalWord: string,
    translations: string,
    sourceLanguage: string = "German"
  ): Promise<string> {
    try {
      const chain = this.textTranslationPrompt.pipe(this.chatModel);
      const response = await chain.invoke({
        sourceLanguage,
        targetLanguage,
        text,
        originalWord,
        translations,
      });

      return response.content.toString().trim();
    } catch (error) {
      console.error("Text translation error:", error);
      return "";
    }
  }

  async translateWord(
    word: string,
    targetLanguage: string,
    sourceLanguage: string = "German"
  ): Promise<string> {
    try {
      const chain = this.wordTranslationPrompt.pipe(this.chatModel);
      const response = await chain.invoke({
        sourceLanguage,
        targetLanguage,
        word,
      });

      return response.content.toString().trim();
    } catch (error) {
      console.error("Word translation error:", error);
      return "";
    }
  }

  async ensureTranslation(
    word: NotionWord,
    targetLanguage: string,
    sourceLanguage: string = "German"
  ): Promise<NotionWord> {
    const result = { ...word };

    if (!result.Translation && result.Name) {
      result.Translation = await this.translateWord(
        result.Name,
        targetLanguage,
        sourceLanguage
      );
    }

    if (!result["Example sentence translation"] && result["Example sentence"]) {
      result["Example sentence translation"] = await this.translateText(
        result["Example sentence"],
        targetLanguage,
        result.Name,
        result.Translation,
        sourceLanguage
      );
    }

    return result;
  }
}
