import { Text } from 'ink';
import React from 'react';

type Props = {
  name: string | undefined;
};

export default function App({ name = 'Friend' }: Props) {
  return (
    <Text>
      Hello, <Text color="red">{name}</Text>!
    </Text>
  );
}
