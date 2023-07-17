import './config';
import './error_handlers';

import './modules';
import context from './modules/common/global_context';

const main = async () => {
  try {
    await context.init();
  } catch (e) {
    console.error(`Failed to initialize application: ${e}`);
    process.exit(1);
  }
};

main()
  .then(() => null)
  .catch(err => console.error(err));
