import { useCallback, useEffect, useState } from 'react';
import { getActiveOfficials, getAllOfficialsForAdmin } from '../services/officialsService';

export function useOfficials({ mode = 'public' } = {}) {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOfficials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list =
        mode === 'admin'
          ? await getAllOfficialsForAdmin()
          : await getActiveOfficials();
      setOfficials(list);
    } catch (err) {
      setError(err.message || 'Unable to load officials.');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    const loadOfficials = async () => {
      try {
        const list =
          mode === 'admin'
            ? await getAllOfficialsForAdmin()
            : await getActiveOfficials();

        if (!cancelled) {
          setOfficials(list);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load officials.');
          setLoading(false);
        }
      }
    };

    void loadOfficials();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  return {
    officials,
    loading,
    error,
    refetch: fetchOfficials,
  };
}
