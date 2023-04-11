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
import { User, GoogleAuthProvider, OAuthProvider, linkWithPopup, unlink, getAuth } from "firebase/auth";
import { db } from "./firestore";
import { SavedDataType } from "beautiful-skill-tree";
import { AutocompleteOption } from "../types/autoCompleteOption.type";
import { EntityStatus } from "firecms";
import { IUser } from "../types/iuser.type";
import { IComposition } from "../types/icomposition.type";
import { IResult } from "../types/iresult.type";

export const linkAccount = async (authProvider: 'Google' | 'Microsoft', link: boolean): Promise<string | undefined> => {
    const auth = getAuth();
    const user = auth.currentUser;
    let provider;
    if (authProvider === 'Google') {
        provider = new GoogleAuthProvider();
    } else if (authProvider === 'Microsoft') {
        provider = new OAuthProvider('microsoft.com');
    }
    if (!provider || !user) return;
    try {
        if (link) {
            await linkWithPopup(user, provider);
        } else {
            await unlink(user, provider.providerId)
        }
        return;
    } catch (err: any) {
        return err.message;
    }
}

export const getUserRoles = async (userId: string): Promise<[string[] | null, string | null]> => {
    const userRolesRef = collection(db, 'users/' + userId + '/roles')
    try {
        const snap = await getDocs(userRolesRef);
        if (snap.empty) return [["instructor"], null]
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

export const getUserPermissions = async (roles: string[]): Promise<[{ [char: string]: { view: boolean, create: boolean, edit: boolean, delete: boolean } } | null, string | null]> => {
    const permissionRef = collection(db, 'permissions');
    let permissions: { [char: string]: { view: boolean, create: boolean, edit: boolean, delete: boolean } } = {};
    try {
        const snap = await getDocs(permissionRef);
        snap.docs.forEach(d => {
            if (roles.includes(d.id)) {
                const rolePermissions: { [char: string]: { view: boolean, create: boolean, edit: boolean, delete: boolean } } = d.data();
                Object.keys(rolePermissions).forEach(key => {
                    permissions[key] = {
                        view: permissions.view ? true : rolePermissions[key].view,
                        create: permissions.create ? true : rolePermissions[key].create,
                        edit: permissions.edit ? true : rolePermissions[key].edit,
                        delete: permissions.delete ? true : rolePermissions[key].delete
                    }
                })
            };
        });
        return [permissions, null];
    } catch (err: any) {
        return [null, "Error while retrieving user permissions" + err.message]
    }
}

export const getUserOrganization = async (userId: string): Promise<[string | undefined, string | null]> => {
    const userRef = doc(db, 'users', userId)
    try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) return [undefined, "No user record found"]
        const { organizations } = snap.data();
        const primaryOrganization = organizations ? organizations[0].id : undefined;
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

export const getUserResults = async (userId: string): Promise<[IResult | null, string | null]> => {
    const docRef = doc(db, 'results', userId);
    try {
        const snap = await getDoc(docRef);
        if (!snap.exists) return [null, "No result record found"];
        const result = { id: snap.id, ...snap.data() } as IResult;
        return [result, null];
    } catch (err: any) {
        return [null, err.message as string];
    }
}
