import { initializeApp } from "firebase/app";
import {
    collection,
    doc,
    getCountFromServer,
    getFirestore,
    updateDoc,
} from "firebase/firestore";
import { firebaseConfig } from "../firebase_config";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

export const deleteFromPathRecursively = async (path: string, collection: string) => {
    const deleteFirestorePathRecursively = httpsCallable(
        functions,
        "deleteFirestorePathRecursively"
    );
    try {
        await deleteFirestorePathRecursively({
            collection,
            path,
        });
        return;
    } catch (err: any) {
        return "Could not delete skills: " + err.message;
    }
}

export const updateOrder = async (path: string, order: number) => {
    const ref = doc(db, path);
    return updateDoc(ref, {
        order
    });
}


export const getCountFromPath = async (path: string) => {
    const coll = collection(db, path);
    const snapshot = await getCountFromServer(coll);
    return snapshot.data().count;
}

export const createDocRef = (path: string) => {
    return doc(db, path);
}