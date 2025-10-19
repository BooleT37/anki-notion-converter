import { OpenAI } from 'openai';
import { NotionWord } from '../types';

export class TranslationService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text to ${targetLanguage}. Only return the translation, nothing else.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Translation error:', error);
      return '';
    }
  }

  async ensureTranslation(word: NotionWord, targetLanguage: string): Promise<NotionWord> {
    const result = { ...word };
    
    if (!result.Translation && result.Name) {
      result.Translation = await this.translateText(result.Name, targetLanguage);
    }
    
    if (!result['Example sentence translation'] && result['Example sentence']) {
      result['Example sentence translation'] = await this.translateText(
        result['Example sentence'],
        targetLanguage
      );
    }
    
    return result;
  }
}
