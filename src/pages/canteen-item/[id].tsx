import { useRouter } from 'next/router';
import { CanteenItemDetail } from '@/components/canteen-items/CanteenItemsDetail';

export default function CanteenItemDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return <div>Loading...</div>;
  }

  return <CanteenItemDetail id={id} />;
} 