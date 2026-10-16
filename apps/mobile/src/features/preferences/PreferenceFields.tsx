import { Text, View } from 'react-native';
import { Choice, form } from '../../components/Forms';
import { type } from '../../theme/tokens';
import { preferenceOptions, type UserRoutePreferences } from './model';
export function PreferenceFields({ value, onChange, section, labels }: { value: UserRoutePreferences; onChange: (p: UserRoutePreferences) => void; section?: 'walking' | 'mobility'; labels?: Record<string, string> }) {
  return <View style={form.group}>
    {preferenceOptions.filter(o => !section || o[2] === section).map(([key, label]) =>
      <Choice key={key} label={labels?.[key] || label} selected={value[key]} onPress={() => onChange({ ...value, [key]: !value[key] })}/>)}
    {section !== 'mobility' && <><Text style={type.title}>Maximum extra walking time</Text>
      <Text style={type.caption}>Compared with the fastest usable route. A strict limit may leave no matching route.</Text>
      <View style={form.row}>{[undefined, 0, 5, 10, 15].map(n => <Choice key={String(n)} radio label={n === undefined ? 'No limit' : `${n} extra min`}
        selected={value.maxDetourMinutes === n} onPress={() => onChange({ ...value, maxDetourMinutes: n })}/>)}</View></>}
    <Text style={type.caption}>Covered paths and ramps/elevators are saved for later; they do not change routing yet. Step-Free remains a separate route profile.</Text>
  </View>;
}
