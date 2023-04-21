import { createContext } from 'react';
import { AutocompleteOption } from "../types/autoCompleteOption.type";
import { IComposition } from '../types/icomposition.type';
import { IEvaluationModel } from '../types/ievaluation.model.type';
import { IEvaluation } from '../types/ievaluation.type';
import { IEvent } from '../types/ievent.type';
import { ILabel } from '../types/ilabel.type';

type ViewerSettings = {
    mode: "editor" | "teacher" | "student" | "initializing", 
    composition: IComposition | null,
    evaluationModel: IEvaluationModel | null,
    selectedUser: AutocompleteOption | null,
    users: AutocompleteOption[],
    evaluations: IEvaluation[],
    events: IEvent[],
    labels: ILabel[]
}

export const ViewerContext = createContext<ViewerSettings>({
    mode: "initializing",
    composition: null,
    evaluationModel: null,
    selectedUser: null,
    users: [],
    evaluations: [],
    events: [],
    labels: []
});