import './hooks';
import './config';

import './modules';
import context from './modules/common/global_context';

process.on('exit', () => {
  context.destroy();
});

context.init()
  .then(() => console.log('Application started'))
  .catch(e => console.error(`Failed to start the application: ${e}`));
