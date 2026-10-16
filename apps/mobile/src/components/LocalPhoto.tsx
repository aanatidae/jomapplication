import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { SecondaryButton } from './Buttons';
import { ErrorText, form } from './Forms';
import { theme, type } from '../theme/tokens';
export function PhotoPreview({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? <Text style={type.caption}>Photo unavailable on this device.</Text> : <Image accessible accessibilityRole="image" accessibilityLabel="Attached local photo" source={{ uri }} onError={() => setFailed(true)} resizeMode="cover" style={{ width: '100%', aspectRatio: 1.5, borderRadius: theme.radius.md }}/>;
}
export function LocalPhoto({ uri, onChange }: { uri?: string; onChange: (uri?: string) => void }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function pick() {
    setBusy(true); setError('');
    try {
      const result = await launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: false });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset || !/^(file|content):\/\//.test(asset.uri) || (asset.mimeType && !asset.mimeType.startsWith('image/')) || (asset.fileSize && asset.fileSize > 10 * 1024 * 1024)) {
        setError('Choose an image smaller than 10 MB.'); return;
      }
      onChange(asset.uri);
    } catch { setError('Photos could not be opened. Check photo access in device settings, retry, or continue without a photo.'); }
    finally { setBusy(false); }
  }
  return <View style={form.group}><Text style={type.title}>Photo · optional</Text>
    <Text style={type.caption}>One photo, stored as a local reference only. It is not uploaded and may become unavailable if device storage is cleared.</Text>
    {uri && <><PhotoPreview key={uri} uri={uri}/><SecondaryButton label="Remove photo" onPress={() => onChange(undefined)}/></>}
    {error ? <ErrorText text={error}/> : null}
    <SecondaryButton label={busy ? 'Opening photos…' : uri ? 'Change photo' : 'Choose photo'} disabled={busy} onPress={() => void pick()}/>
  </View>;
}
