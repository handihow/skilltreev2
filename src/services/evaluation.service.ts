import { DocumentReference, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { IEvaluation } from "../collections/evaluation_collection";
import { IEvaluationModel } from "../collections/evaluation_model_collection";
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

export const getEvaluatedSkill = async (userId: string, skillId: string) => {
    const evaluationColRef = collection(db, 'evaluations');
    const evaluationQuery = query(evaluationColRef, where("skill", "==", skillId), where("student", "==", userId));
    try {
        const snap = await getDocs(evaluationQuery);
        if (snap.empty) return [null, null];
        return [snap.docs[0].id, null];
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
