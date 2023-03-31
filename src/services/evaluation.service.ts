import { DocumentReference, getDoc, collection, query, where, getDocs, addDoc, collectionGroup, doc } from "firebase/firestore";
import { IEvaluationModel } from "../types/ievaluation.model.type";
import { IEvaluation } from "../types/ievaluation.type";
import { ISkill } from "../types/iskill.type";

import { db } from "./firestore";


export const getEvaluationModel = async (docRef: DocumentReference): Promise<[IEvaluationModel | null, string | null]> => {
    try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const evaluationModel = { id: snap.id, ...snap.data() } as IEvaluationModel;
            return [evaluationModel, null];
        } else {
            return [null, "No evaluation model found"]
        }
    } catch (e: any) {
        return [null, e.message as string];
    }
}

export const getEvaluatedSkill = async (userId: string, skillId: string) : Promise<[IEvaluation | null, string | null]> => {
    const evaluationColRef = collection(db, 'evaluations');
    const evaluationQuery = query(evaluationColRef, where("skill", "==", skillId), where("student", "==", userId));
    try {
        const snap = await getDocs(evaluationQuery);
        if (snap.empty) return [null, null];
        const evaluation: IEvaluation = { id: snap.docs[0].id, ...snap.docs[0].data()} as IEvaluation
        return [evaluation, null];
    } catch (e: any) {
        return [null, e.message as string];
    }
}

export const addEvaluationToHistory = (evaluation: IEvaluation) => {
    if (!evaluation.id) return;
    const collectionRef = collection(db, "evaluations", evaluation.id, "history");
    try {
        addDoc(collectionRef, evaluation);
        return;
    } catch (err: any) {
        return err.message as string;
    }
}


export const getCompositionEvaluations = async (compositionId: string, userId: string) : Promise<[ISkill[], IEvaluation[], string | null]> => {
    try {
        const skillsColRef = collectionGroup(db, 'skills');
        const skillsQuery = query(skillsColRef, where("composition", "==", compositionId));
        const snap = await getDocs(skillsQuery);
        const skills: ISkill[] = [];
        for (const doc of snap.docs) {
            const skill = {id: doc.id, parent: doc.ref.path.split("/"), path: doc.ref.path, ...doc.data()} as ISkill;
            skills.push(skill);
        }
        const evaluationColRef = collection(db, 'evaluations');
        const compositionDoc = doc(db, "compositions", compositionId);
        const studentDoc = doc(db, 'users', userId);
        const evaluationQuery = query(evaluationColRef, where("composition", "==", compositionDoc), where("student", "==", studentDoc));
        const evalSnap = await getDocs(evaluationQuery);
        const evaluations: IEvaluation[] = evalSnap.docs.map(doc => {
            return { id: doc.id, ...doc.data()} as IEvaluation;
        })
        return [skills, evaluations, null];
    } catch(e: any) {
        return [[],[], e.message as string];
    }

}