import {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
  SlashCommandBuilder
} from 'discord.js';
import config from '../config';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

export const registerCommands = async (commands: SlashCommandBuilder[]) => {
  const payload: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
  commands.forEach(c => payload.push(c.toJSON()));

  const rest = new REST().setToken(config.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(config.DISCORD_APP_ID), { body: payload });
};

export default client;
