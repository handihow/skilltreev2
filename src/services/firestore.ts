import { initializeApp } from "firebase/app";
import { addDoc, arrayRemove, arrayUnion, collection, collectionGroup, doc, getDoc, getDocs, getFirestore, orderBy, query, setDoc, Timestamp, updateDoc, where } from "firebase/firestore";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and get a reference to the service
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

export const getUserRoles = async (userId: string) : Promise<[string[] | null, string | null]> => {
    const userRolesRef = collection(db, 'users/' + userId+ '/roles')
    try {
        const snap = await getDocs(userRolesRef);
        if(snap.empty) return [[], "No user roles found"]
        const roles = snap.docs.map(d => { 
            if(d.data().hasRole) {
                return d.id
            } else {
                return "";
            }
        });
        return [roles, null];
    } catch(err: any) {
        return [[], "Error while retrieving user roles" + err.message]
    }
}

export const addComposition = async (userId: string, email: string) : Promise<string | undefined> => {
    try {
        const newComposition: IComposition = {
            title: "My SkillTree",
            user: userId,
            username: email,
            hasBackgroundImage: false,
            canCopy: false,
            loggedInUsersCanEdit: true,
            loggedInUsersOnly: true,
            skillcount: 3,
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
        const newRootSkill = {
            skilltree: skilltree.id,
            composition: composition.id,
            ...standardRootSkill
        };
        const rootSkillColRef = collection(db, 'compositions', composition.id, 'skilltrees', skilltree.id, 'skills');
        const rootSkill = await addDoc(rootSkillColRef, newRootSkill);
        await updateDoc(rootSkill, { id: rootSkill.id })
        const childSkillColRef = collection(db, 'compositions', composition.id, 'skilltrees', skilltree.id, 'skills', rootSkill.id, 'skills');
        for (const child of standardChildSkills) {
            const childSkill = await addDoc(childSkillColRef, { skilltree: skilltree.id, composition: composition.id, ...child });
            await updateDoc(childSkill, { id: childSkill.id })
        }
        return;
    } catch (err: any) {
        return "Could not add skilltree: " + err.message;
    }
}

export const deleteComposition = async (id: string) : Promise<string | undefined> => {
    const path = `compositions/${id}`;
    const deleteFirestorePathRecursively = httpsCallable(
        functions,
        "deleteFirestorePathRecursively"
    );
    try {
        await deleteFirestorePathRecursively({
            collection: "Skilltree",
            path: path,
        });
        return;
    } catch(err: any) {
        return "Could not delete skilltree: " + err.message;
    }
}

export const addOrRemoveSharedUser = async (userId: string, compositionId: string, add = true ) : Promise<string | undefined> => {
    const docRef = doc(db, 'compositions', compositionId);
    const sharedUsers = add ? arrayUnion(userId) : arrayRemove(userId);
    try {
        await updateDoc(docRef, { sharedUsers })
    } catch(err: any) {
        console.log(err);
        return err.message as string;
    }
}

export const getCompositions = async (userId: string, view: "owned" | "shared"): Promise<[IComposition[] | null, string | null]> => {
    const skillTreeColRef = collection(db, 'compositions');
    let skillTreeQuery;
    if (view === "owned") {
        skillTreeQuery = query(skillTreeColRef, where("user", "==", userId), orderBy("lastUpdate", "desc"));
    } else {
        skillTreeQuery = query(skillTreeColRef, where("sharedUsers", "array-contains", userId), orderBy("lastUpdate", "desc"))
    }
    try {
        const snap = await getDocs(skillTreeQuery)
        const compositions: IComposition[] = []
        for (const value of snap.docs) {
            let composition: IComposition = { id: value.id, ...value.data() as IComposition };
            if (composition.backgroundImage) {
                const resized = composition.backgroundImage.split(".")[0] + "_500x500." + composition.backgroundImage.split(".")[1];
                try {
                    const reference = ref(storage, resized);
                    composition.url = await getDownloadURL(reference);
                } catch (e) {
                    console.log(e);
                    composition.url = "https://via.placeholder.com/360x254.png?text=Skilltree"
                }
            } else {
                composition.url = "https://via.placeholder.com/360x254.png?text=Skilltree"
            }
            compositions.push(composition);
        }
        return [compositions, null];
    } catch (e: any) {
        return [null, e.message as string];
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

export const getCompositionSkilltrees = async (id: string): Promise<[ISkilltree[] | null, number, string | null]> => {
    const skillTreeColRef = collection(db, 'compositions', id, 'skilltrees');
    const skillTreeQuery = query(skillTreeColRef, orderBy("order", "asc"));
    try {
        const snap = await getDocs(skillTreeQuery);
        const skilltrees: ISkilltree[] = snap.docs.map(value => {
            return { id: value.id, ...value.data() as ISkilltree }
        })
        const skillsColRef = collectionGroup(db, 'skills');
        const skillQuery = query(skillsColRef, where("composition", "==", id), orderBy("order"));
        const skillSnap = await getDocs(skillQuery);
        const skills: ISkill[] = [];
        skillSnap.docs.forEach((doc) => {
            const skill: ISkill = {
                parent: doc.ref.path.split("/"),
                path: doc.ref.path,
                ...(doc.data() as ISkill),
            };
            skills.push(skill);
        });
        skilltrees.forEach((skilltree) => {
            skilltree.data = skillArrayToSkillTree(
                skills.filter((s: ISkill) => s.skilltree === skilltree.id),
                true
            );
        });
        return [skilltrees, skillSnap.docs.length, null];
    } catch (e: any) {
        return [null, 0, e.message as string];
    }
}

export const getSharedUsers = async (id: string): Promise<[AutocompleteOption[] | null, string | null]> => {
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
        return [labels, null];
    } catch (e: any) {
        return [null, e.message as string];
    }
}

export const getUserResults = async (userId: string | null, skilltrees: ISkilltree[] | null): Promise<[SavedDataType[] | null, string | null]> => {
    if (!skilltrees || !userId) return [null, null];
    const data: SavedDataType[] = [];
    try {
        for (const skilltree of skilltrees) {
            const resultRef = doc(db, 'results', userId, 'skilltrees', skilltree?.id || '');
            const result = await getDoc(resultRef);
            const resultObj = result.exists() ? result.data()?.skills : {}
            data.push(resultObj);
        }
        return [data, null];
    } catch (e: any) {
        return [null, e.message as string];
    }
}

export const saveUserResults = async (userId: string | undefined, treeId: string, compositionId: string | undefined, skills: SavedDataType, progress: number) => {
    if (!userId || !compositionId) return "Not enough information to store results";
    const skilltreeDoc = doc(db, 'results', userId, 'skilltrees', treeId);
    try {
        await setDoc(skilltreeDoc, {
            skills,
            id: treeId,
            compositionId: compositionId,
        });
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
        return;
    } catch (e: any) {
        return e.message as string;
    }

}