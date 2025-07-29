import { render } from 'ink';
import meow from 'meow';
import React from 'react';

import App from './app.js';

const cli = meow(
  `
	Usage
	  $ baptist <directories...>

	Options
	  --force  Force the operation to run even if the git repository has uncommitted changes
		--log  Enable logging to baptist.log file

	Examples
	  $ baptist src components
	  $ baptist src --log
	  $ baptist . --log
`,
  {
    importMeta: import.meta,
    flags: {
      force: {
        type: 'boolean',
        default: false,
      },
      log: {
        type: 'boolean',
        default: false,
      },
    },
  }
);

if (cli.input.length === 0) {
  console.error('Error: Please provide at least one directory to process');
  process.exit(1);
}

render(<App directories={cli.input} enableLogging={cli.flags.log} force={cli.flags.force} />);
