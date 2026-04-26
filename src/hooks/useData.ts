import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useEffect, useState } from 'react';

export function useBatches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'batches'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setBatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'batches'));
  }, []);

  return { batches, loading };
}

export function useBatchStudents(batchId?: string) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batchId) return;
    const q = query(collection(db, 'students'), where('batchId', '==', batchId));
    return onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `students/${batchId}`));
  }, [batchId]);

  return { students, loading };
}

export function useBatchSessions(batchId?: string) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batchId) return;
    const q = query(
      collection(db, 'sessions'), 
      where('batchId', '==', batchId),
      orderBy('sessionNumber', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `sessions/${batchId}`));
  }, [batchId]);

  return { sessions, loading };
}

export function useUpcomingSessions(count: number = 3) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'sessions'),
      where('date', '>=', new Date().toISOString()),
      orderBy('date', 'asc'),
      limit(count)
    );
    return onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'upcoming_sessions'));
  }, [count]);

  return { sessions, loading };
}
