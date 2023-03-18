import { Timestamp, collection, addDoc, updateDoc, doc, getDoc, getDocs, orderBy, query, collectionGroup, deleteDoc, where } from "firebase/firestore";
import { IComposition } from "../collections/composition_collection";
import { db } from "./firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "./firestore";
import { ISkilltree } from "../collections/skilltree_collection";
import { standardChildSkills, standardRootSkill } from "../common/StandardData";

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


export const addComposition = async (userId: string, email: string): Promise<string | undefined> => {
    try {
        const newComposition: IComposition = {
            title: "My SkillTree",
            user: userId,
            username: email,
            canCopy: false,
            loggedInUsersCanEdit: true,
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
        if (error) return error;
        return;
    } catch (err: any) {
        return "Could not add skilltree: " + err.message;
    }
}

export const updateCompositionShareSettings = (compositionId: string, value: "copy" | "authorize" | "update", setTo: boolean) => {
    const compositionDoc = doc(db, "compositions", compositionId);
    switch (value) {
        case "copy":
            updateDoc(compositionDoc, { canCopy: setTo });
            break;
        case "authorize":
            updateDoc(compositionDoc, { requireShareApproval: setTo });
            break;
        case "update":
            updateDoc(compositionDoc, { loggedInUsersCanEdit: setTo });
            break;
        default:
            break;
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


export const copyComposition = async (composition: IComposition, userId: string, userEmail: string) => {

    if (!composition.id) return "No composition ID";
    //first create a copy of the composition 
    const newComposition = {
        ...composition,
        id: '',
        user: userId,
        username: userEmail,
        sharedUsers: [],
        title: "Copy of " + composition.title,
        lastUpdate: Timestamp.now(),
        createdAt: Timestamp.now()
    };
    const newCompositionRef = collection(db, "compositions");
    const compositionDoc = await addDoc(newCompositionRef, newComposition);
    console.log('created document with id' + compositionDoc.id);
    await updateDoc(compositionDoc, { id: compositionDoc.id });
    console.log('updated the composition');
    //then copy all the skilltrees
    const [skilltrees, error] = await getCompositionSkilltrees(composition.id);
    console.log('found ' + skilltrees?.length + ' skilltrees');
    if (error || !skilltrees) return "No skilltrees found";

    for (const skilltree of skilltrees) {
        if (!skilltree.id) continue;

        const newSkilltree = {
            ...skilltree,
            id: '',
            composition: compositionDoc.id,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };
        const newSkilltreeRef = collection(db, "compositions", compositionDoc.id, "skilltrees");
        const skilltreeDoc = await addDoc(newSkilltreeRef, newSkilltree);
        console.log('skilltree added')
        await updateDoc(skilltreeDoc, { id: skilltreeDoc.id });
        const rootSkillsRef = collection(db, "compositions", composition.id, "skilltrees", skilltree.id, "skills");
        const rootSkillSnapshot = await getDocs(rootSkillsRef);
        for (const rootSkillDoc of rootSkillSnapshot.docs) {
            const newRootSkill = {
                ...rootSkillDoc.data(),
                id: '',
                composition: compositionDoc.id,
                skilltree: skilltreeDoc.id,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };
            const newRootSkillRef = collection(db, "compositions", compositionDoc.id, "skilltrees", skilltreeDoc.id, "skills");
            const newRootSkillDoc = await addDoc(newRootSkillRef, newRootSkill);
            await updateDoc(newRootSkillDoc, { id: newRootSkillDoc.id });
            await copyChildSkills(
                rootSkillDoc.ref.path,
                newRootSkillDoc.path,
                compositionDoc.id,
                skilltreeDoc.id,
            );
        }
    }
};

const copyChildSkills = async (
    previousPath: string,
    newPath: string,
    newCompositionId: string,
    newSkilltreeId: string,
) => {
    const childSkillRef = collection(db, previousPath + "/skills");
    const childSkillSnapshot = await getDocs(childSkillRef);
    for (const childSkillDoc of childSkillSnapshot.docs) {
        const newChildSkill = {
            ...childSkillDoc.data(),
            composition: newCompositionId,
            skilltree: newSkilltreeId,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };
        const newChildSkillRef = collection(db, newPath + "/skills");
        const newChildSkillDoc = await addDoc(newChildSkillRef, newChildSkill);
        await updateDoc(newChildSkillDoc, { id: newChildSkillDoc.id });
        console.log(childSkillDoc.ref.path);
        console.log(newChildSkillDoc.path);
        await copyChildSkills(
            childSkillDoc.ref.path,
            newChildSkillDoc.path,
            newCompositionId,
            newSkilltreeId,
        );
    }
    return;

};



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
        if (withChildren) {
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

export const getSkillPath = async (skillId: string) => {
    const skillsColRef = collectionGroup(db, 'skills');
    const skillQuery = query(skillsColRef, where("id", "==", skillId));
    try {
        const skillSnap = await getDocs(skillQuery);
        if (skillSnap.empty) return [null, "No skill found"];
        return [skillSnap.docs[0].ref.path, null]
    } catch (err: any) {
        return [null, err.message as string];
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
