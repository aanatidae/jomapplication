import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { ErrorText, FormPage } from '../../components/Forms';
import { type } from '../../theme/tokens';
import { communityRepository } from './repository';
import { CommunityRouteCard } from './components';
import type { CommunityRoute, CommunityRouteRepository } from './types';
export function CommunityScreen({ repository = communityRepository }: { repository?: CommunityRouteRepository }) {
  const [routes, setRoutes] = useState<CommunityRoute[]>([]); const [status, setStatus] = useState('loading'); const [attempt, setAttempt] = useState(0);
  const [visibleCount, setVisibleCount] = useState(20);
  useEffect(() => {
    let active = true;
    repository.listRoutes().then(rows => { if (active) { setRoutes(rows); setStatus('ready'); } }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [repository, attempt]);
  return <FormPage title="Community"><Text style={type.body}>Local knowledge for your next walk.</Text>
    <Text style={type.caption}>Simulated demo routes and this device’s submissions. Community information may need confirmation; conditions can change.</Text>
    <PrimaryButton label="Share a route" onPress={() => router.push('/share-route')}/>
    {status === 'loading' ? <Text style={type.body}>Loading shared routes…</Text> : status === 'error' ? <><ErrorText text="Couldn't load routes. Try again."/><SecondaryButton label="Retry" onPress={() => setAttempt(n => n + 1)}/></> : routes.length ? routes.slice(0, visibleCount).map(route => <CommunityRouteCard key={route.id} route={route} onOpen={() => router.push({ pathname: '/community-route', params: { id: route.id } })}/>) : <Text style={type.body}>No routes shared yet. Share a useful walk to start the feed.</Text>}
    {routes.length > visibleCount && <SecondaryButton label="Show more" onPress={() => setVisibleCount(n => n + 20)}/>}
  </FormPage>;
}
