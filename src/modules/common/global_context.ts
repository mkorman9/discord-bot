import { ChannelType, Client, Message } from 'discord.js';
import client from '../../providers/discord_client';
import config from '../../config';
import { EventArgs } from './types';
import { Module } from './module';

export class GlobalContext {
  private modules = new Map<string, Module>();

  constructor(private client: Client) {}

  async init() {
    this.client.on('ready', () => {
      this.emit('ready', {});
    });

    this.client.on('messageCreate', (msg: Message) => {
      if (msg.channel.type === ChannelType.DM) {
        this.emit('directMessage', {
          message: msg
        });
      } else if (msg.channel.type === ChannelType.GuildText) {
        this.emit('guildMessage', {
          message: msg
        });
      }
    });

    await this.client.login(config.DISCORD_TOKEN);
  }

  loadModule(moduleName: string, m: Module) {
    this.modules.set(moduleName, m);
  }

  unloadModule(moduleName: string) {
    this.modules.delete(moduleName);
  }

  emit<E extends keyof EventArgs>(event: E, ...args: EventArgs[E]) {
    this.modules.forEach(m => {
      m.propagate(event, ...args);
    });
  }
}

export default new GlobalContext(client);
