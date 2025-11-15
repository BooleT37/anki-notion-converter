import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export class ContentGenerationService {
  private chatModel: ChatOpenAI;
  private exampleGenerationPrompt: ChatPromptTemplate;

  constructor(apiKey: string) {
    this.chatModel = new ChatOpenAI({
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      apiKey,
    });

    this.exampleGenerationPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a language teacher creating example sentences in {language}. Create a concise, simple sentence that clearly demonstrates the usage of the given word. The sentence should focus on the word itself and be easy to understand. Only return the sentence, nothing else.",
      ],
      ["user", "Word: {word}"],
    ]);
  }

  async generateExampleSentence(
    word: string,
    language: string = "German"
  ): Promise<string> {
    try {
      const chain = this.exampleGenerationPrompt.pipe(this.chatModel);
      const response = await chain.invoke({
        language,
        word,
      });

      return response.content.toString().trim();
    } catch (error) {
      console.error("Example sentence generation error:", error);
      return "";
    }
  }
}
