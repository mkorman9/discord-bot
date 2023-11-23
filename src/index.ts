import './hooks';
import './config';

import {ModuleLoader} from './common/module_loader';
import {ModuleDefinition} from './common/module';

const modules = [
  './modules/example_module'
];
const moduleLoader = new ModuleLoader();

process.on('exit', () => {
  console.log('Exiting');
  moduleLoader.destroy();
});

Promise.all(modules.map(m => import(m)))
  .then(definitions => moduleLoader.init(definitions.map(d => d.default as ModuleDefinition)))
  .then(() => console.log('Application has started successfully'))
  .catch(e => console.error(`Failed to start the application: ${e.stack}`));
