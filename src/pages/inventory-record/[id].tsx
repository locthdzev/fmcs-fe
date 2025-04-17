import { useRouter } from 'next/router';
import InventoryRecordDetails from '../../components/inventory-record/InventoryRecordDetails';

export default function InventoryRecordDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  // Only render the component when we have an ID
  if (!id || typeof id !== 'string') {
    return null;
  }

  return <InventoryRecordDetails id={id} />;
}
