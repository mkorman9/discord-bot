import './hooks';
import './config';

import {readdir} from 'fs/promises';
import {join} from 'path';
import {Bot} from './bot/bot';
import {ModuleDeclaration} from './bot/module';

const modulesPath = './modules';
const bot = new Bot();

process.on('exit', () => {
  bot.stop();
});

const resolveModules = async () => {
  const modules = await Promise.all(
    await readdir(join(__dirname, modulesPath))
      .then(files => files.filter(f => f.endsWith('.js')))
      .then(files => files.map(f => `${modulesPath}/${f.split('.')[0]}`))
      .then(files => files.map(f => import(f)))
  );
  return modules.map(m => m.default as ModuleDeclaration);
};

resolveModules()
  .then(modules => bot.start(modules))
  .catch(e => {
    console.log(`🚫 Failed to start the bot: ${e.stack}`);
    process.exit(1);
  });
