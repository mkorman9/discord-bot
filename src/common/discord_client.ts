import {Client, Partials} from 'discord.js';

export const createClient = (intents: number[], partials: Partials[]) => {
  return new Client({
    intents: intents,
    partials: partials
  });
};
