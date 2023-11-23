import {readdir} from 'fs/promises';
import {join} from 'path';
import './hooks';
import './config';

import {ModuleLoader} from './common/module_loader';
import {ModuleDefinition} from './common/module';

const modulesPath = './modules';
const moduleLoader = new ModuleLoader();

const resolveModules = async () => {
  const files = await readdir(join(__dirname, modulesPath))
    .then(files => files.filter(f => f.endsWith('.js')))
    .then(files => files.map(f => `${modulesPath}/${f.split('.')[0]}`))
    .then(files => files.map(f => import(f)));
  const modules = await Promise.all(files);
  return modules.map(m => m.default as ModuleDefinition);
};

process.on('exit', () => {
  console.log('Exiting');
  moduleLoader.destroy();
});

resolveModules()
  .then(modules => moduleLoader.init(modules))
  .then(() => console.log('Application has started successfully'))
  .catch(e => console.error(`Failed to start the application: ${e.stack}`));
