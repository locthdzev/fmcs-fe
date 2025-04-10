import { GetServerSideProps } from 'next';
import { DrugDetail } from '@/components/drug/DrugDetail';
import { useRouter } from 'next/router';

interface DrugDetailPageProps {
  id: string;
}

export default function DrugDetailPage({ id }: DrugDetailPageProps) {
  return <DrugDetail id={id} />;
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