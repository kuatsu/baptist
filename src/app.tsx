import React from 'react';
import { Text } from 'ink';

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
