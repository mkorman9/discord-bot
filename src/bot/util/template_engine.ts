import {TwingEnvironment, TwingExtension, TwingFilter, TwingFunction, TwingLoaderArray} from 'twing';
import config from '../../config';

export type Language = string;
export type TemplateContent = string;
export type LocalizedTemplate = Record<Language, TemplateContent>;
export type TemplateRenderContext = Record<string, unknown>;

export class TemplateEngine {
  private readonly DefaultLanguage: Language = 'en-US';

  private templates = new Map<string, string>();
  private filters: TwingFilter[] = [];
  private functions: TwingFunction[] = [];
  private globals: {name: string, value: unknown}[] = [];
  private twing: TwingEnvironment | undefined;

  registerTemplate(name: string, content: LocalizedTemplate | TemplateContent) {
    if (typeof content === 'string') {
      this.templates.set(name, content.replace(/\n  +/g, '\n'));
    } else {
      const localized = content[config.BOT_LANGUAGE] || content[this.DefaultLanguage];
      if (!localized) {
        console.log(`⚠️ Localized template ${name} doesn't contain any known translations`);
        return;
      }

      this.registerTemplate(name, localized);
    }
  }

  registerFilter(filter: TwingFilter) {
    this.filters.push(filter);
  }

  registerFunction(func: TwingFunction) {
    this.functions.push(func);
  }

  registerGlobal(name: string, value: unknown) {
    this.globals.push({name, value});
  }

  async render(name: string, context: TemplateRenderContext): Promise<string> {
    this.ensureInitialized();

    if (!this.templates.has(name)) {
      throw new Error(`Template ${name} cannot be resolved`);
    }

    return await this.twing!.render(name, context);
  }

  private ensureInitialized() {
    if (!this.twing) {
      this.twing = new TwingEnvironment(
        new TwingLoaderArray(Object.fromEntries(this.templates))
      );

      this.filters.forEach(f => this.twing?.addFilter(f));
      this.functions.forEach(f => this.twing?.addFunction(f));
      this.globals.forEach(g => this.twing?.addGlobal(g.name, g.value));
    }
  }
}
