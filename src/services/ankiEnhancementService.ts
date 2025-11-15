import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export class AnkiEnhancementService {
  private chatModel: ChatOpenAI;
  private sentenceWithoutWordPrompt: ChatPromptTemplate;
  private germanAlternativesPrompt: ChatPromptTemplate;
  private pluralFormsPrompt: ChatPromptTemplate;
  private partOfSpeechPrompt: ChatPromptTemplate;
  private articleDetectionPrompt: ChatPromptTemplate;

  constructor(apiKey: string) {
    this.chatModel = new ChatOpenAI({
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      apiKey,
    });

    this.sentenceWithoutWordPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        'Replace the specified German word in the sentence with "***". Keep everything else exactly the same. Only return the modified sentence, without the "Sentence: " prefix.',
      ],
      ["user", "Sentence: {sentence}\nWord to replace: {word}"],
    ]);

    this.germanAlternativesPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "Given a Russian word, provide German words that can be translated to this Russian word. Focus on the first/primary Russian translation if multiple are provided. Provide alternatives separated by commas. These don't need to be exact synonyms, just German words that could reasonably translate to the given Russian word.",
      ],
      ["user", "Russian word/translation: {russianWord}"],
    ]);

    this.pluralFormsPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "For the given German word, provide its plural form and common inflected forms (if applicable). For nouns, include the plural. For verbs, include key conjugations. For adjectives, include comparative forms if relevant. Format as a concise list separated by commas.",
      ],
      ["user", "German word: {word}"],
    ]);

    this.partOfSpeechPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        'Identify the part of speech for the given German word. Return only the part of speech (e.g., "noun", "verb", "adjective", "adverb", etc.).',
      ],
      ["user", "German word: {word}"],
    ]);

    this.articleDetectionPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "For the given German noun, determine the correct definite article (der, die, das) and ensure the noun starts with a capital letter (German nouns are always capitalized). If the word already has an article, return it as-is but ensure proper capitalization. If it's not a noun, return the word unchanged. Only return the word with the correct article and capitalization.",
      ],
      ["user", "German word: {word}"],
    ]);
  }

  async createSentenceWithoutWord(
    sentence: string,
    word: string
  ): Promise<string> {
    try {
      const chain = this.sentenceWithoutWordPrompt.pipe(this.chatModel);
      const response = await chain.invoke({
        sentence,
        word,
      });

      return response.content.toString().trim();
    } catch (error) {
      console.error("Error creating sentence without word:", error);
      return sentence.replace(new RegExp(word, "gi"), "***");
    }
  }

  async generateGermanAlternatives(russianWord: string): Promise<string> {
    try {
      const chain = this.germanAlternativesPrompt.pipe(this.chatModel);
      const response = await chain.invoke({
        russianWord,
      });

      return response.content.toString().trim();
    } catch (error) {
      console.error("Error generating German alternatives:", error);
      return "";
    }
  }

  async generatePluralAndInflectedForms(word: string): Promise<string> {
    try {
      const chain = this.pluralFormsPrompt.pipe(this.chatModel);
      const response = await chain.invoke({
        word,
      });

      return response.content.toString().trim();
    } catch (error) {
      console.error("Error generating plural and inflected forms:", error);
      return "";
    }
  }

  async identifyPartOfSpeech(word: string): Promise<string> {
    try {
      const chain = this.partOfSpeechPrompt.pipe(this.chatModel);
      const response = await chain.invoke({
        word,
      });

      return response.content.toString().trim();
    } catch (error) {
      console.error("Error identifying part of speech:", error);
      return "";
    }
  }

  async addArticleIfNeeded(word: string): Promise<string> {
    try {
      // Check if word already has an article
      const hasArticle = /^(der|die|das)\s+/i.test(word.trim());
      if (hasArticle) {
        return word.trim();
      }

      const chain = this.articleDetectionPrompt.pipe(this.chatModel);
      const response = await chain.invoke({
        word,
      });

      return response.content.toString().trim();
    } catch (error) {
      console.error("Error adding article:", error);
      return word;
    }
  }
}
