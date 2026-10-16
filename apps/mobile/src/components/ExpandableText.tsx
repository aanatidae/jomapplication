import { useState } from 'react';
import { Text, View } from 'react-native';
import { SecondaryButton } from './Buttons';
import { form } from './Forms';
import { type } from '../theme/tokens';
export function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 240;
  return <View style={form.group}><Text numberOfLines={long && !expanded ? 4 : undefined} style={type.body}>{long && !expanded ? `${text.slice(0, 240)}…` : text}</Text>
    {long && <SecondaryButton label={expanded ? 'Show less' : 'Read full description'} onPress={() => setExpanded(v => !v)}/>}
  </View>;
}
