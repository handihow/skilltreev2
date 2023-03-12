import { initializeApp } from "firebase/app";
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    collectionGroup,
    doc,
    getCountFromServer,
    getDoc,
    getDocs,
    getFirestore,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    deleteDoc
} from "firebase/firestore";
import { firebaseConfig } from "../firebase_config";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { IComposition } from "../collections/composition_collection";
import { ISkilltree } from "../collections/skilltree_collection";
import { ISkill } from "../collections/skill_collection";
import { skillArrayToSkillTree } from "../common/StandardFunctions";
import { AutocompleteOption } from "../common/AutoCompleteOption.model";
import { SavedDataType } from "beautiful-skill-tree";
import { IUser } from "../collections/user_collection";
import { standardRootSkill, standardChildSkills } from "../common/StandardData";
import { User } from "firebase/auth";
import { EntityStatus } from "firecms";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);
const functions = getFunctions(app);
export const storage = getStorage(app);

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
        const { organization = null } = snap.data();
        return [organization, null];
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



export const addComposition = async (userId: string, email: string): Promise<string | undefined> => {
    try {
        const newComposition: IComposition = {
            title: "My SkillTree",
            user: userId,
            username: email,
            canCopy: false,
            loggedInUsersCanEdit: true,
            loggedInUsersOnly: true,
            lastUpdate: Timestamp.now(),
        };
        const skillTreeColRef = collection(db, 'compositions');
        const composition = await addDoc(skillTreeColRef, newComposition);
        await updateDoc(composition, { id: composition.id });
        const newSkilltree = {
            title: "Example skilltree",
            description: "More information about my skill tree",
            collapsible: true,
            order: 0,
        };
        const skilltreeColRef = collection(db, 'compositions', composition.id, 'skilltrees');
        const skilltree = await addDoc(skilltreeColRef, newSkilltree);
        await updateDoc(skilltree, { id: skilltree.id });
        const error = await createSkilltreeSkills(skilltree.id, composition.id, true);
        if(error) return error;
        return;
    } catch (err: any) {
        return "Could not add skilltree: " + err.message;
    }
}

export const createSkilltreeSkills = async (skilltreeId: string, compositionId: string, withChildren: boolean) => {
    try {
        const newRootSkill = {
            skilltree: skilltreeId,
            composition: compositionId,
            ...standardRootSkill
        };
        const rootSkillColRef = collection(db, 'compositions', compositionId, 'skilltrees', skilltreeId, 'skills');
        const rootSkill = await addDoc(rootSkillColRef, newRootSkill);
        await updateDoc(rootSkill, { id: rootSkill.id })
        if(withChildren) {
            const childSkillColRef = collection(db, 'compositions', compositionId, 'skilltrees', skilltreeId, 'skills', rootSkill.id, 'skills');
            for (const child of standardChildSkills) {
                const childSkill = await addDoc(childSkillColRef, { skilltree: skilltreeId, composition: compositionId, ...child });
                await updateDoc(childSkill, { id: childSkill.id })
            }
        }
        return;
    } catch (err: any) {
        return err.message as string;
    }

}

export const deleteComposition = async (id: string): Promise<string | undefined> => {
    const path = `compositions/${id}`;
    const deleteFirestorePathRecursively = httpsCallable(
        functions,
        "deleteFirestorePathRecursively"
    );
    try {
        await deleteFirestorePathRecursively({
            collection: "Skilltree",
            path,
        });
        return;
    } catch (err: any) {
        return "Could not delete skilltree: " + err.message;
    }
}

export const deleteSkillsOfSkilltree = async (skilltreeId: string) => {
    const skillsColRef = collectionGroup(db, 'skills');
    const skillQuery = query(skillsColRef, where("skilltree", "==", skilltreeId));
    try {
        const skillSnap = await getDocs(skillQuery);
        for (const doc of skillSnap.docs) {
            await deleteDoc(doc.ref);
        }
        return;
    } catch (err: any) {
        return err.message as string;
    }
}

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

export const getComposition = async (id: string): Promise<[IComposition | null, string | null]> => {
    const compositionRef = doc(db, 'compositions/' + id);
    try {
        const snap = await getDoc(compositionRef);
        if (snap.exists()) {
            const composition = { id, ...snap.data() } as IComposition;
            return [composition, null];
        } else {
            return [null, "No composition found"]
        }
    } catch (e: any) {
        return [null, e.message as string];
    }
}

export const getCompositionSkilltrees = async (id: string): Promise<[ISkilltree[] | null, string | null]> => {
    const skillTreeColRef = collection(db, 'compositions', id, 'skilltrees');
    const skillTreeQuery = query(skillTreeColRef, orderBy("order", "asc"));
    try {
        const snap = await getDocs(skillTreeQuery);
        const skilltrees: ISkilltree[] = snap.docs.map(value => {
            return { id: value.id, ...value.data() as ISkilltree }
        })
        return [skilltrees, null];
    } catch (e: any) {
        return [null, e.message as string];
    }
}

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

export const getUserResults = async (userId: string, skilltree: ISkilltree): Promise<[SavedDataType | null, string | null]> => {
    try {
        const resultRef = doc(db, 'results', userId, 'skilltrees', skilltree?.id || '');
        const result = await getDoc(resultRef);
        const resultObj = result.exists() ? result.data()?.skills : {}
        return [resultObj, null];
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

export const getCountFromPath = async (path: string) => {
    const coll = collection(db, path);
    const snapshot = await getCountFromServer(coll);
    return snapshot.data().count;
}