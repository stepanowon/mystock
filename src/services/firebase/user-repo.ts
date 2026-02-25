import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type FieldValue,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { UserProfile, UserSettings } from '@/types'
import { DEFAULT_USER_SETTINGS } from '@/types'

function getUserDocRef(uid: string) {
  return doc(db, 'users', uid)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(getUserDocRef(uid))
  if (!snapshot.exists()) return null
  return { ...snapshot.data(), uid } as UserProfile
}

export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string,
): Promise<void> {
  const existing = await getUserProfile(uid)
  if (existing) return

  await setDoc(getUserDocRef(uid), {
    uid,
    email,
    displayName,
    photoURL: photoURL ?? null,
    settings: DEFAULT_USER_SETTINGS,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateUserSettings(
  uid: string,
  settings: Partial<UserSettings>,
): Promise<void> {
  const docRef = getUserDocRef(uid)
  const updates: Record<string, FieldValue | Partial<unknown>> = { updatedAt: serverTimestamp() }
  for (const [key, value] of Object.entries(settings)) {
    updates[`settings.${key}`] = value
  }
  await updateDoc(docRef, updates)
}
