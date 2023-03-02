import { initializeApp } from "firebase/app";
import { arrayUnion, collection, collectionGroup, doc, getDoc, getDocs, getFirestore, orderBy, query, setDoc, where } from "firebase/firestore";
import { firebaseConfig } from "../firebase_config";
import { getFunctions } from "firebase/functions";
import { IComposition } from "../collections/composition_collection";
import { ISkilltree } from "../collections/skilltree_collection";
import { ISkill } from "../collections/skill_collection";
import { skillArrayToSkillTree } from "../common/StandardFunctions";
import { AutocompleteOption } from "../common/AutoCompleteOption.model";
import { SavedDataType } from "beautiful-skill-tree";
import { IUser } from "../collections/user_collection";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);
export const functions = getFunctions(app);

export const getComposition = async (id: string) : Promise<[IComposition | null, string | null]>  => {
    const compositionRef = doc(db, 'compositions/' + id);
    try {
        const snap = await getDoc(compositionRef);
        if (snap.exists()) {
            const composition = { id, ...snap.data() } as IComposition;
            return [composition, null];
        } else {
            return [null, "No composition found"]
        }
    } catch(e: any) {
        return [null, e.message as string];
    }
}

export const getCompositionSkilltrees = async(id: string) : Promise<[ISkilltree[] | null, number, string | null]> => {
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
    } catch(e: any) {
        return [null, 0, e.message as string];
    }
}

export const getSharedUsers = async (id: string) : Promise<[AutocompleteOption[] | null, string | null]> => {
    const resultColRef = collection(db, 'results');
    const resultQuery = query(resultColRef, where('compositions', 'array-contains', id), orderBy('displayName'));
    try {
        const snap = await getDocs(resultQuery);
        if(snap.empty) {
            return [null, null];
        }
        const labels = snap.docs.map(d => {
            return { id: d.id, label: d.data().displayName } as AutocompleteOption;
        });
        return [labels, null];
    } catch(e: any) {
        return [null, e.message as string];
    }
}

export const getUserResults = async (userId: string | null, skilltrees: ISkilltree[] | null): Promise<[SavedDataType[] | null, string | null]> => {
    if(!skilltrees || !userId) return [null, null];
    const data: SavedDataType[] = [];
    try {
        for (const skilltree of skilltrees) {
            const resultRef = doc(db, 'results', userId, 'skilltrees', skilltree?.id || '');
            const result = await getDoc(resultRef);
            const resultObj = result.exists() ? result.data()?.skills : {}
            data.push(resultObj);
        }
        return [data, null];
    } catch(e: any) {
        return [null, e.message as string];
    }
}

export const saveUserResults = async(userId: string | undefined, treeId: string, compositionId: string | undefined, skills: SavedDataType, progress: number) => {
    if(!userId || !compositionId) return "Not enough information to store results";
    const skilltreeDoc = doc(db, 'results', userId, 'skilltrees', treeId);
    try {
        await setDoc(skilltreeDoc, {
            skills,
            id: treeId,
            compositionId: compositionId,
        });
        const userDoc = doc(db, 'users', userId);
        const snap = await getDoc(userDoc);
        const {email = "", displayName = "", photoURL = "" } = snap.data() as IUser;
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
    } catch(e: any) {
        return e.message as string;
    }
    
}