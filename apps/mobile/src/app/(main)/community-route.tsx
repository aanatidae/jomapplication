import { useLocalSearchParams } from 'expo-router';
import { DetailScreen } from '../../features/community/DetailScreen';
export default function CommunityRoute() { const { id } = useLocalSearchParams<{ id: string }>(); return <DetailScreen key={id} id={id || ''}/>; }
