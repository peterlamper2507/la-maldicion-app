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

export interface Visitor {
  id: string;
  url: string;
  pageTitle: string;
  sessionId: string;
  lastSeen: Timestamp;
  location?: string;
}

export const createChat = async (customerName: string, customerEmail?: string, sessionId?: string) => {
  const path = 'chats';
  try {
    const docRef = await addDoc(collection(db, path), {
      status: 'waiting',
      customerName,
      customerEmail: customerEmail || '',
      sessionId: sessionId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const trackVisitor = async (sessionId: string, url: string, pageTitle: string) => {
  const visitorId = sessionId;
  const path = `visitors/${visitorId}`;
  try {
    await setDoc(doc(db, 'visitors', visitorId), {
      url,
      pageTitle,
      sessionId,
      lastSeen: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    // Slient fail for now if permission issues in dev
    console.warn("Visitor tracking failed:", error);
  }
};

export const subscribeToVisitors = (callback: (visitors: Visitor[]) => void) => {
  const path = 'visitors';
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const q = query(collection(db, path), where('lastSeen', '>=', Timestamp.fromDate(fiveMinAgo)), orderBy('lastSeen', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const visitors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Visitor[];
    callback(visitors);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const inviteToChat = async (sessionId: string) => {
  const path = 'chats';
  try {
    const docRef = await addDoc(collection(db, path), {
      status: 'waiting',
      customerName: 'Visitor',
      sessionId: sessionId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      initiatedByAgent: true
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const subscribeToInvites = (sessionId: string, callback: (chatId: string) => void) => {
  const path = 'chats';
  const q = query(collection(db, path), where('sessionId', '==', sessionId), where('status', '==', 'waiting'));

  return onSnapshot(q, (snapshot) => {
    const invite = snapshot.docs.find(d => d.data().initiatedByAgent === true);
    if (invite) {
      callback(invite.id);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const sendMessage = async (chatId: string, text: string, sender: 'customer' | 'agent' | 'system', senderId: string, senderName: string) => {
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
