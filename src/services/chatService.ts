import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  where,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Chat {
  id: string;
  status: 'open' | 'closed' | 'waiting';
  customerName: string;
  customerEmail?: string;
  agentId?: string;
  lastMessage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id: string;
  chatId: string;
  text: string;
  sender: 'customer' | 'agent' | 'system';
  senderId?: string;
  senderName: string;
  timestamp: Timestamp;
}

export const createChat = async (customerName: string, customerEmail?: string) => {
  const path = 'chats';
  try {
    const docRef = await addDoc(collection(db, path), {
      status: 'waiting',
      customerName,
      customerEmail: customerEmail || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const sendMessage = async (chatId: string, text: string, sender: 'customer' | 'agent', senderId: string, senderName: string) => {
  const path = `chats/${chatId}/messages`;
  try {
    // Add message
    await addDoc(collection(db, path), {
      chatId,
      text,
      sender,
      senderId,
      senderName,
      timestamp: serverTimestamp(),
    });

    // Update chat last activity
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  const path = `chats/${chatId}/messages`;
  const q = query(collection(db, path), orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Message[];
    callback(messages);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const subscribeToActiveChats = (callback: (chats: Chat[]) => void) => {
  const path = 'chats';
  const q = query(collection(db, path), where('status', 'in', ['open', 'waiting']), orderBy('updatedAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Chat[];
    callback(chats);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const acceptChat = async (chatId: string, agentId: string) => {
  try {
    await updateDoc(doc(db, 'chats', chatId), {
      status: 'open',
      agentId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}`);
  }
};

export const closeChat = async (chatId: string) => {
  try {
    await updateDoc(doc(db, 'chats', chatId), {
      status: 'closed',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}`);
  }
};

export const setupAgent = async (uid: string, name: string, email: string) => {
  const path = `agents/${uid}`;
  try {
    await setDoc(doc(db, 'agents', uid), {
      name,
      email,
      role: 'agent',
      status: 'online'
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
