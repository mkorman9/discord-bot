import {CommandInteraction, Message} from 'discord.js';

export interface Event {
  ready: Record<string, never>;
  directMessage: Message;
  guildMessage: Message;
  command: CommandInteraction;
}
