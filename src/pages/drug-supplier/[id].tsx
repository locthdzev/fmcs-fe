import { GetServerSideProps } from 'next';
import { DrugSupplierDetail } from '@/components/drug-supplier/DrugSupplierDetails';

interface DrugSupplierDetailPageProps {
  id: string;
}

export default function DrugSupplierDetailPage({ id }: DrugSupplierDetailPageProps) {
  return <DrugSupplierDetail id={id} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  
  if (!id || typeof id !== 'string') {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      id,
    },
  };
};
