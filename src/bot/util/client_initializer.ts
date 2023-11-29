import {Client, Partials} from 'discord.js';
import config from '../../config';

export class ClientInitializer {
  private client: Client | undefined;

  private intents = new Set<number>();
  private partials = new Set<Partials>();

  addIntents(intents: number[]) {
    intents.forEach(i => this.intents.add(i));
  }

  addPartials(partials: Partials[]) {
    partials.forEach(p => this.partials.add(p));
  }

  init() {
    this.client = new Client({
      intents: [...this.intents],
      partials: [...this.partials]
    });
  }

  async login() {
    await this.client?.login(config.DISCORD_TOKEN);
  }

  get(): Client {
    if (!this.client) {
      throw new Error('Client is undefined');
    }

    return this.client;
  }

  destroy() {
    this.client?.destroy();
    this.intents = new Set();
    this.partials = new Set();
  }
}
