import {CommandInteraction, Message} from 'discord.js';

type Empty = Record<string, never>;

export interface Event {
  load: Empty;
  unload: Empty;
  ready: Empty;
  directMessage: Message;
  guildMessage: Message;
  command: CommandInteraction;
}
