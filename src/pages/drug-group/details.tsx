import { useEffect } from "react";
import { useRouter } from 'next/router';

export default function DrugGroupDetailsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Chuyển hướng đến trang quản lý drug group
    router.replace("/drug-group");
  }, [router]);
  
  return null;
} 