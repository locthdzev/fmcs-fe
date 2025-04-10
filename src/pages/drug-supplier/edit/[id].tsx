import { GetServerSideProps } from 'next';
import { DrugSupplierEdit } from '@/components/drug-supplier/DrugSupplierEdit';
import { useRouter } from 'next/router';

interface DrugSupplierEditPageProps {
  id: string;
}

export default function DrugSupplierEditPage({ id }: DrugSupplierEditPageProps) {
  return <DrugSupplierEdit id={id} />;
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