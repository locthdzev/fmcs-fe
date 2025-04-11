import { GetServerSideProps } from 'next';
import { DrugEdit } from '@/components/drug/DrugEdit';
import { useRouter } from 'next/router';

interface DrugEditPageProps {
  id: string;
}

export default function DrugEditPage({ id }: DrugEditPageProps) {
  return <DrugEdit id={id} />;
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