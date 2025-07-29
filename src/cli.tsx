import { render } from 'ink';
import meow from 'meow';
import React from 'react';

import App from './app.js';

const cli = meow(
  `
	Usage
	  $ baptist

	Options
		--name  Your name

	Examples
	  $ baptist --name=Jane
	  Hello, Jane
`,
  {
    importMeta: import.meta,
    flags: {
      name: {
        type: 'string',
      },
    },
  }
);

render(<App name={cli.flags.name} />);
