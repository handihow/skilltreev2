import { createContext } from 'react';
import { AutocompleteOption } from "../types/autoCompleteOption.type";
import { IComposition } from '../types/icomposition.type';
import { IEvaluationModel } from '../types/ievaluation.model.type';
import { IEvaluation } from '../types/ievaluation.type';
import { IEvent } from '../types/ievent.type';

type ViewerSettings = {
    mode: "editor" | "instructor" | "student" | "initializing", 
    composition: IComposition | null,
    evaluationModel: IEvaluationModel | null,
    selectedUser: AutocompleteOption | null,
    users: AutocompleteOption[],
    evaluations: IEvaluation[],
    events: IEvent[]
}

export const ViewerContext = createContext<ViewerSettings>({
    mode: "initializing",
    composition: null,
    evaluationModel: null,
    selectedUser: null,
    users: [],
    evaluations: [],
    events: []
});