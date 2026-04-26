import { useEffect, useState, useCallback } from 'react';

export function useBatches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch('/api/batches');
      const data = await res.json();
      setBatches(data);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  return { batches, loading, refresh: fetchBatches };
}

export function useBatchStudents(batchId?: string | number) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    if (!batchId) return;
    try {
      const res = await fetch(`/api/batches/${batchId}/students`);
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { students, loading, refresh: fetchStudents };
}

export function useBatchSessions(batchId?: string | number) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!batchId) return;
    try {
      const res = await fetch(`/api/batches/${batchId}/sessions`);
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, refresh: fetchSessions };
}

export function useUpcomingSessions(count: number = 5) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await fetch('/api/sessions/upcoming');
        const data = await res.json();
        setSessions(data.slice(0, count));
      } catch (err) {
        console.error('Failed to fetch upcoming sessions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, [count]);

  return { sessions, loading };
}
