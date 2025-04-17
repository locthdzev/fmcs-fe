import { useRouter } from 'next/router';
import { CanteenItemEdit } from '@/components/canteen-items/CanteenItemEdit';

export default function EditCanteenItemPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return <div>Loading...</div>;
  }

  return <CanteenItemEdit id={id} />;
} 