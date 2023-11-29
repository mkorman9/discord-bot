import {Awaitable, Client, ClientEvents, CommandInteraction, Partials, SlashCommandBuilder} from 'discord.js';
import {Bot} from './bot';
import {LocalizedTemplate, TemplateContent, TemplateEngine, TemplateRenderContext} from './util/template_engine';
import {CronExecutor} from './util/cron_executor';
import {ListenersStore} from './util/listeners_store';

export type ModuleDeclaration = (bot: Bot) => Module;

export class Module {
  private listenersStore = new ListenersStore();
  private cronExecutor = new CronExecutor();
  private templateEngine = new TemplateEngine();

  constructor(
    private moduleName: string,
    private bot: Bot
  ) {
  }

  async load() {
    try {
      await this.bot.loadModule(this);

      this.once('ready', () => this.cronExecutor.start());
      this.listenersStore.start();

      console.log(`➡️ Module ${this.moduleName} loaded`);
    } catch (e) {
      console.log(`🚫 Failed to load module ${this.moduleName}: ${e}`);
    }
  }

  unload() {
    try {
      this.cronExecutor.stop();
      this.listenersStore.stop();

      this.bot.unloadModule(this.moduleName);

      console.log(`⬅️ Module ${this.moduleName} unloaded`);
    } catch (e) {
      console.log(`🚫 Failed to unload module ${this.moduleName}: ${e}`);
    }
  }

  name(): string {
    return this.moduleName;
  }

  client(): Client {
    return this.bot.client();
  }

  intents(...intents: number[]): this {
    this.bot.requestIntents(intents);
    return this;
  }

  partials(...partials: Partials[]): this {
    this.bot.requestPartials(partials);
    return this;
  }

  template(name: string, content: LocalizedTemplate | TemplateContent) {
    this.templateEngine.registerTemplate(name, content);
  }

  async render(name: string, context: TemplateRenderContext): Promise<string> {
    return this.templateEngine.render(name, context);
  }

  on<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => Awaitable<void>): this {
    this.listenersStore.onStart(() => this.bot.client().on(event, listener));
    this.listenersStore.onStop(() => this.off(event, listener));
    return this;
  }

  once<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => Awaitable<void>): this {
    this.listenersStore.onStart(() => this.bot.client().once(event, listener));
    this.listenersStore.onStop(() => this.off(event, listener));
    return this;
  }

  off<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => Awaitable<void>): this {
    this.bot.client().off(event, listener);
    return this;
  }

  emit<E extends keyof ClientEvents>(event: E, ...args: ClientEvents[E]): this {
    this.bot.client().emit(event, ...args);
    return this;
  }

  cron(expression: string, listener: () => Awaitable<void>): this {
    this.cronExecutor.registerTask(expression, listener);
    return this;
  }

  command(
    command: SlashCommandBuilder,
    listener: (interaction: CommandInteraction) => Awaitable<void>
  ): this {
    this.bot.registerCommand(this.moduleName, command);

    this.on('interactionCreate', interaction => {
      if (interaction.isCommand() && interaction.commandName === command.name) {
        listener(interaction);
      }
    });

    return this;
  }
}

export const declareModule = (name: string, init: (m: Module) => void): ModuleDeclaration => {
  return (bot: Bot) => {
    const m = new Module(name, bot);
    init(m);
    return m;
  };
};
