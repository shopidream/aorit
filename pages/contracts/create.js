import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../contexts/AuthContext';

export default function CreateContractPage() {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();
  const { quoteId } = router.query;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      if (quoteId) {
        router.push(`/contracts/create/clauses?quoteId=${quoteId}`);
      } else {
        router.push('/quotes?from=contracts');
      }
    }
  }, [isAuthenticated, loading, router, quoteId]);

  return null;
}