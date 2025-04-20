import { GetServerSideProps } from 'next';
import { UserDetail } from '@/components/user/UserDetail';
import { useRouter } from 'next/router';

interface UserDetailPageProps {
  id: string;
}

export default function UserDetailPage({ id }: UserDetailPageProps) {
  return <UserDetail id={id} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;

  return {
    props: {
      id: id as string,
    },
  };
}; 