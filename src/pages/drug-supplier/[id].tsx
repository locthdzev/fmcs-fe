import React from 'react';
import { useRouter } from 'next/router';
import { DrugSupplierDetail } from '@/components/drug-supplier/DrugSupplierDetails'; // Adjust path if needed
// import Layout from '@/components/Layout'; // Removed Layout import

const DrugSupplierDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;

  // Handle cases where id is not yet available or is an array (shouldn't happen with default routing)
  if (!id || Array.isArray(id)) {
    // Basic loading/error state
    return <div>Loading supplier ID or invalid ID...</div>;
  }

  // Render the detail component directly
  return <DrugSupplierDetail id={id} />;
};

export default DrugSupplierDetailPage;
