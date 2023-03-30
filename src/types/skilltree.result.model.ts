import { SavedDataType } from "beautiful-skill-tree";

export type ISkilltreeResult = {
    id: string,
    compositionId: string,
    skills: SavedDataType;
}