import { createContext } from 'react';
import { AutocompleteOption } from "../types/autoCompleteOption.type";
import { IComposition } from '../types/icomposition.type';
import { IEvaluationModel } from '../types/ievaluation.model.type';

type ViewerSettings = {
    mode: "editor" | "teacher" | "student" | "initializing", 
    composition: IComposition | null,
    evaluationModel: IEvaluationModel | null,
    selectedUser: AutocompleteOption | null
}

export const ViewerContext = createContext<ViewerSettings>({
    mode: "initializing",
    composition: null,
    evaluationModel: null,
    selectedUser: null
});