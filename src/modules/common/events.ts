import { CacheType, CommandInteraction, Message } from 'discord.js';

export interface Event {
  ready: {};
  directMessage: Message;
  guildMessage: Message;
  command: CommandInteraction<CacheType>;
}
