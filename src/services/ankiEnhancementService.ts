import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export class AnkiEnhancementService {
  private chatModel: ChatOpenAI;
  private sentenceWithoutWordPrompt: ChatPromptTemplate;
  private germanAlternativesPrompt: ChatPromptTemplate;
  private pluralFormsPrompt: ChatPromptTemplate;
  private partOfSpeechPrompt: ChatPromptTemplate;

  constructor(apiKey: string) {
    this.chatModel = new ChatOpenAI({
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      apiKey,
    });

    this.sentenceWithoutWordPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        'Replace the specified German word in the sentence(s), with "***". If there are more than one sentence, replace it in all of them. Keep everything else exactly the same, including the sentence numbers (1., 2., etc.). Only return the modified sentence without the "Sentence: " prefix.',
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
}
