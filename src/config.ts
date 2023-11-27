import 'dotenv/config';
import {z} from 'zod';

const str = () => z.string();
const bool = () => z.string().transform(v => ['true', '1'].includes(v.toLowerCase()));
const int = () => z.preprocess(Number, z.number().int());

const ConfigSchema = z.object({
  DISCORD_APP_ID: str(),
  DISCORD_TOKEN: str(),
  IGNORED_MODULES: str().optional().transform(
    v => new Set<string>(v ? v.split(',') : [])
  ),
  BOT_LANGUAGE: str().default('en-US')
});

export default (() => {
  try {
    return ConfigSchema.parse(process.env);
  } catch (e) {
    console.log(`🚫 Configuration loading has failed: ${e}`);
    process.exit(1);
  }
})();
