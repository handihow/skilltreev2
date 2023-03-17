import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    where,
} from "firebase/firestore";
import { IUser } from "../collections/user_collection";
import { User } from "firebase/auth";
import { db } from "./firestore";
import { SavedDataType } from "beautiful-skill-tree";
import { AutocompleteOption } from "../common/AutoCompleteOption.model";
import { EntityStatus } from "firecms";
import { IComposition } from "../collections/composition_collection";

export const getUserRoles = async (userId: string): Promise<[string[] | null, string | null]> => {
    const userRolesRef = collection(db, 'users/' + userId + '/roles')
    try {
        const snap = await getDocs(userRolesRef);
        if (snap.empty) return [[], "No user roles found"]
        const roles = snap.docs.map(d => {
            if (d.data().hasRole) {
                return d.id
            } else {
                return "";
            }
        });
        return [roles, null];
    } catch (err: any) {
        return [[], "Error while retrieving user roles" + err.message]
    }
}

export const getUserOrganization = async (userId: string): Promise<[string | undefined, string | null]> => {
    const userRef = doc(db, 'users', userId)
    try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) return [undefined, "No user record found"]
        const { organizations } = snap.data();
        const primaryOrganization = organizations ? organizations[0] : undefined;
        return [primaryOrganization, null];
    } catch (err: any) {
        return [undefined, err.message]
    }
}

export const updateUser = async (user: User | null): Promise<string | null> => {
    if (!user) return "No user";
    const updatedUser = constructUser(user);
    const userRef = doc(db, 'users', user.uid);
    try {
        await setDoc(userRef, updatedUser, { merge: true });
        return null;
    } catch (err: any) {
        return err.message;
    }
}

const constructUser = (user: User) => {
    let hostedDomain = "";
    const provider = user?.providerData[0]?.providerId || "password";
    if (
        provider &&
        provider === "google.com" &&
        user.email &&
        !["gmail.com", "googlemail.com"].includes(user.email.split("@").pop() || "")
    ) {
        hostedDomain = user.email.split("@").pop() || "";
    } else if (
        provider &&
        provider === "microsoft.com" &&
        user.email &&
        !["outlook.com", "live.com", "hotmail.com"].includes(
            user.email.split("@").pop() || ""
        )
    ) {
        hostedDomain = user.email.split("@").pop() || "";
    }
    //create or update user record in firestore db
    const signedInUser: IUser = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL
            ? user.photoURL
            : `https://eu.ui-avatars.com/api/?name=${user.displayName}`,
        emailVerified: user.emailVerified,
        hostedDomain,
        provider,
        creationTime: user?.metadata?.creationTime || null,
        lastSignInTime: user?.metadata?.lastSignInTime || null,
    };
    return signedInUser;
};



export const getSharedUsers = async (id: string, userId: string): Promise<[AutocompleteOption[] | null, string | null]> => {
    const resultColRef = collection(db, 'results');
    const resultQuery = query(resultColRef, where('compositions', 'array-contains', id), orderBy('displayName'));
    try {
        const snap = await getDocs(resultQuery);
        if (snap.empty) {
            return [null, null];
        }
        const labels = snap.docs.map(d => {
            return { id: d.id, label: d.data().displayName } as AutocompleteOption;
        });
        const ownLabelIndex = labels.findIndex(l => l.id === userId);
        if (ownLabelIndex > -1) labels.splice(ownLabelIndex, 1);
        return [labels, null];
    } catch (e: any) {
        return [null, e.message as string];
    }
}


export const saveUserResults = async (userId: string | undefined, treeId: string, compositionId: string | undefined, skills: SavedDataType, progress: number) => {
    if (!userId || !compositionId) return "Not enough information to store results";
    const skilltreeDoc = doc(db, 'results', userId, 'skilltrees', treeId);
    try {
        const userDoc = doc(db, 'users', userId);
        const snap = await getDoc(userDoc);
        const { email = "", displayName = "", photoURL = "" } = snap.data() as IUser;
        const resultDoc = doc(db, 'results', userId);
        await setDoc(resultDoc, {
            user: userId,
            email,
            displayName,
            photoURL,
            compositions: arrayUnion(compositionId),
            progress: {
                [compositionId]: progress,
            },
        }, { merge: true });
        await setDoc(skilltreeDoc, {
            skills,
            id: treeId,
            compositionId: compositionId,
        });
        return;
    } catch (e: any) {
        return e.message as string;
    }

}



export const updateSharedUserStatus = async (sharedUserIds: string[], compositionId: string, status: EntityStatus) => {
    const compositionRef = doc(db, 'compositions', compositionId);
    try {
        if (status === "existing") {
            const snap = await getDoc(compositionRef);
            const { sharedUsers = [] } = snap.data() as IComposition;
            for (const id of sharedUsers) {
                const index = sharedUserIds.findIndex(sui => sui === id);
                if (index === -1) {
                    await addOrRemoveSharedUser(id, compositionId, false, false);
                }
            }
        }
        for (const userId of sharedUserIds) {
            await addOrRemoveSharedUser(userId, compositionId, true, false);
        }
        return;
    } catch (err: any) {
        return err.message;
    }
}

export const addOrRemovePendingApprovalUser = async (userId: string, compositionId: string, add = true): Promise<string | undefined> => {
    const docRef = doc(db, 'compositions', compositionId);
    const pendingApprovalUsers = add ? arrayUnion(userId) : arrayRemove(userId);
    try {
        await setDoc(docRef, { pendingApprovalUsers }, { merge: true });
    } catch (err: any) {
        console.log(err);
        return err.message as string;
    }
}

export const addOrRemoveSharedUser = async (userId: string, compositionId: string, add = true, updateComposition = true): Promise<string | undefined> => {
    const docRef = doc(db, 'compositions', compositionId);
    const sharedUsers = add ? arrayUnion(userId) : arrayRemove(userId);
    const resultDocRef = doc(db, 'results', userId);
    const compositions = add ? arrayUnion(compositionId) : arrayRemove(compositionId);
    const userDocRef = doc(db, 'users', userId);
    try {
        if (updateComposition) await setDoc(docRef, { sharedUsers }, { merge: true });
        const snap = await getDoc(userDocRef);
        const { email = "", displayName = "", photoURL = "" } = snap.data() as IUser;
        await setDoc(resultDocRef, {
            user: userId,
            email,
            displayName,
            photoURL,
            compositions,
        }, { merge: true });
    } catch (err: any) {
        console.log(err);
        return err.message as string;
    }
}

