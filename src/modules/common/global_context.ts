import {
  ChannelType,
  Client,
  Message,
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
  SlashCommandBuilder
} from 'discord.js';
import client from '../../providers/discord_client';
import config from '../../config';
import { Event } from './events';
import { Module } from './module';

export class GlobalContext {
  private modules = new Map<string, Module>();
  private commands: SlashCommandBuilder[] = [];

  constructor(public client: Client) {}

  async init() {
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
    await this.performCommandsRegistration();
  }

  destroy() {
    this.modules.forEach(m => m.unload());
    this.client.destroy();
  }

  loadModule(moduleName: string, m: Module) {
    this.modules.set(moduleName, m);
  }

  unloadModule(moduleName: string) {
    this.modules.delete(moduleName);
  }

  emit<E extends keyof Event>(e: E, event: Event[E]) {
    this.modules.forEach(m => {
      m.emit(e, event);
    });
  }

  registerCommand(builder: SlashCommandBuilder) {
    this.commands.push(builder);
  }

  private async performCommandsRegistration() {
    const payload: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    this.commands.forEach(c => payload.push(c.toJSON()));

    const rest = new REST().setToken(config.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(config.DISCORD_APP_ID), { body: payload });
  }
}

export default new GlobalContext(client);
