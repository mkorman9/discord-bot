import { Client, SlashCommandBuilder } from 'discord.js';
import { EventEmitter } from 'events';
import client from '../../providers/discord_client';
import globalContext from './global_context';
import { Event } from './events';

export interface Module {
  on<E extends keyof Event>(
    e: E,
    handler: (event: Event[E]) => void | PromiseLike<void>
  ): this;
  once<E extends keyof Event>(
    e: E,
    handler: (event: Event[E]) => void | PromiseLike<void>
  ): this;
  off<E extends keyof Event>(
    e: E,
    handler: (event: Event[E]) => void | PromiseLike<void>
  ): this;
  emit<E extends keyof Event>(
    e: E,
    event: Event[E]
  ): boolean;
}

export class Module extends EventEmitter {
  constructor(
    public name: string,
    public client: Client
  ) {
    super();
  }

  load() {
    globalContext.loadModule(this.name, this);
  }

  unload() {
    globalContext.unloadModule(this.name);
  }

  cron(expression: string, handler: () => PromiseLike<void> | void) {
    
  }

  registerCommand(builder: SlashCommandBuilder): Module {
    globalContext.registerCommand(builder);
    return this;
  }
}

export const declareModule = (moduleName: string, prepare: (m: Module) => void) => {
  const m = new Module(moduleName, client);
  prepare(m);
  m.load();
};
