import {
  ChannelType,
  Message,
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
  SlashCommandBuilder
} from 'discord.js';
import {createClient} from './discord_client';
import config from '../config';
import {Event} from './events';
import {Module, ModuleDefinition} from './module';

export class ModuleLoader {
  public client = createClient();

  private modules = new Map<string, Module>();
  private commandsPerModule = new Map<string, SlashCommandBuilder[]>();
  private initialized = false;
  private destroying = false;

  async init(preloadModules: ModuleDefinition[]) {
    this.client.on('ready', () => {
      this.emit('ready', {});
    });

    this.client.on('messageCreate', (msg: Message) => {
      if (msg.channel.type === ChannelType.DM) {
        this.emit('directMessage', msg);
      } else if (msg.channel.type === ChannelType.GuildText) {
        this.emit('guildMessage', msg);
      }
    });

    this.client.on('interactionCreate', interaction => {
      if (interaction.isCommand()) {
        this.emit('command', interaction);
      }
    });

    await this.client.login(config.DISCORD_TOKEN);
    await Promise.all(
      preloadModules.map(async m => await m.load(this))
    );
    await this.updateCommandsList();

    this.initialized = true;
  }

  destroy() {
    this.destroying = true;
    this.modules.forEach(m => m.unload());
    this.client.destroy();
  }

  async loadModule(moduleName: string, m: Module) {
    this.modules.set(moduleName, m);

    if (this.initialized) {
      await this.updateCommandsList();
    }
  }

  unloadModule(moduleName: string) {
    this.modules.delete(moduleName);
    this.commandsPerModule.delete(moduleName);

    if (!this.destroying) {
      this.updateCommandsList()
        .catch(e => console.error(`Failed to unregister commands of module ${moduleName}: ${e.stack}`));
    }
  }

  emit<E extends keyof Event>(e: E, event: Event[E]) {
    this.modules.forEach(m => {
      m.emit(e, event);
    });
  }

  registerCommand(moduleName: string, command: SlashCommandBuilder) {
    const commandsList = this.commandsPerModule.get(moduleName);
    if (commandsList) {
      commandsList.push(command);
      return;
    }

    this.commandsPerModule.set(moduleName, [command]);
  }

  private async updateCommandsList() {
    const payload: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    this.commandsPerModule.forEach((commands, _) => {
      commands.forEach(c => payload.push(c.toJSON()));
    });

    const rest = new REST().setToken(config.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(config.DISCORD_APP_ID), { body: payload });
  }
}
