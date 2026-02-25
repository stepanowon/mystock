import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

export interface FirestoreRepository<T> {
  getAll(userId: string): Promise<readonly T[]>
  getById(userId: string, id: string): Promise<T | null>
  create(userId: string, data: Omit<T, 'id'>): Promise<T>
  update(userId: string, id: string, data: Partial<T>): Promise<void>
  remove(userId: string, id: string): Promise<void>
  subscribe(
    userId: string,
    callback: (items: readonly T[]) => void,
  ): Unsubscribe
}

function docToEntity<T>(docData: DocumentData, id: string): T {
  return { ...docData, id } as T
}

export function createFirestoreRepo<T extends { readonly id: string }>(
  collectionName: string,
  orderByField?: string,
): FirestoreRepository<T> {
  function getCollectionRef(userId: string) {
    return collection(db, 'users', userId, collectionName)
  }

  function getDocRef(userId: string, id: string) {
    return doc(db, 'users', userId, collectionName, id)
  }

  return {
    async getAll(userId: string): Promise<readonly T[]> {
      const colRef = getCollectionRef(userId)
      const q = orderByField
        ? query(colRef, orderBy(orderByField))
        : colRef
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => docToEntity<T>(d.data(), d.id))
    },

    async getById(userId: string, id: string): Promise<T | null> {
      const docRef = getDocRef(userId, id)
      const snapshot = await getDoc(docRef)
      if (!snapshot.exists()) return null
      return docToEntity<T>(snapshot.data(), snapshot.id)
    },

    async create(userId: string, data: Omit<T, 'id'>): Promise<T> {
      const colRef = getCollectionRef(userId)
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      const docRef = await addDoc(colRef, docData)
      return { ...docData, id: docRef.id } as unknown as T
    },

    async update(userId: string, id: string, data: Partial<T>): Promise<void> {
      const docRef = getDocRef(userId, id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      } as DocumentData)
    },

    async remove(userId: string, id: string): Promise<void> {
      const docRef = getDocRef(userId, id)
      await deleteDoc(docRef)
    },

    subscribe(
      userId: string,
      callback: (items: readonly T[]) => void,
    ): Unsubscribe {
      const colRef = getCollectionRef(userId)
      const q = orderByField
        ? query(colRef, orderBy(orderByField))
        : colRef
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((d) => docToEntity<T>(d.data(), d.id))
        callback(items)
      })
    },
  }
}
