import { ref, putFile, getDownloadURL } from '@react-native-firebase/storage';
import { doc, updateDoc } from '@react-native-firebase/firestore';
import { storage, db } from '../firebase/config';

/** Upload a local image as the user's avatar and persist its URL on the profile. */
export async function uploadAvatar(uid: string, localUri: string): Promise<string> {
  const storageRef = ref(storage, `avatars/${uid}`);
  await putFile(storageRef, localUri); // RNFirebase: uploads a local file URI
  const url = await getDownloadURL(storageRef);
  await updateDoc(doc(db, 'users', uid), { photoURL: url });
  return url;
}
