import 'dotenv/config';

const throwError = (message: string): never => {
  throw new Error(message);
};

export default {
  DISCORD_APP_ID: process.env.DISCORD_APP_ID || throwError('DISCORD_APP_ID needs to be present'),
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || throwError('DISCORD_TOKEN needs to be present')
};
