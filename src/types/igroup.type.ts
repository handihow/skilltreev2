import { DocumentReference } from "firebase/firestore";

export type IGroup = {
    id?: string;
    name: string;
    description?: string;
    period?: string,
    students?: DocumentReference[];
    instructors?: DocumentReference[];
    compositions?: DocumentReference[];
}