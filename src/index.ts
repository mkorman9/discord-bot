import './hooks';
import './config';

import {readdir} from 'fs/promises';
import {join} from 'path';
import {ModuleLoader} from './common/module_loader';
import {ModuleDefinition} from './common/module';

const modulesPath = './modules';
const moduleLoader = new ModuleLoader();

const resolveModules = async () => {
  const modules = await Promise.all(
    await readdir(join(__dirname, modulesPath))
      .then(files => files.filter(f => f.endsWith('.js')))
      .then(files => files.map(f => `${modulesPath}/${f.split('.')[0]}`))
      .then(files => files.map(f => import(f)))
  );
  return modules.map(m => m.default as ModuleDefinition);
};

process.on('exit', () => {
  moduleLoader.destroy();
  console.log('⛔ Application has been stopped');
});

resolveModules()
  .then(modules => moduleLoader.init(modules))
  .then(() => console.log('✅ Application has started successfully'))
  .catch(e => {
    console.log(`🚫 Failed to start the application: ${e.stack}`);
    process.exit(1);
  });
