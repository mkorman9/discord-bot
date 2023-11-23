import 'dotenv/config';
import {z} from 'zod';

const ConfigSchema = z.object({
  DISCORD_APP_ID: z.string(),
  DISCORD_TOKEN: z.string(),
  IGNORED_MODULES: z.string().optional().transform(
    v => new Set<string>(v ? v.split(',') : [])
  )
});

type Config = z.infer<typeof ConfigSchema>;

function loadConfig(): Config {
  try {
    return ConfigSchema.parse(process.env);
  } catch (e) {
    console.log(`🚫 Configuration loading has failed: ${e}`);
    process.exit(1);
  }
}

export default loadConfig();
