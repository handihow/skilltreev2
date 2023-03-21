import { DocumentReference, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { IEvaluationModel } from "../types/ievaluation.model.type";
import { IEvaluation } from "../types/ievaluation.type";

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
