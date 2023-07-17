import { Message } from 'discord.js';

export type Awaitable<T> = T | PromiseLike<T>;

export interface ReadyEvent {}

export interface DirectMessageEvent {
  message: Message;
}

export interface GuildMessageEvent {
  message: Message;
}

export interface CronEvent {
  timestamp: Date;
}

export interface EventArgs {
  ready: [event: ReadyEvent];
  directMessage: [event: DirectMessageEvent];
  guildMessage: [event: GuildMessageEvent];
  cron: [event: CronEvent];
}

export interface EventProps {
  ready: void;
  directMessage: void;
  guildMessage: void;
  cron: {
    runAt: string;
  };
}
