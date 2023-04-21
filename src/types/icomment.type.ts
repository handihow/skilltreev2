import { Timestamp } from "firebase/firestore";
import { ILabel } from "./ilabel.type";

export type IComment = {
    id?: string;
    comment: string;
    labels?: ("ineedhelp" | "question")[];
    createdBy?: string;
    path?: string;
    composition?: any;
    skilltree?: any;
    skill?: any;
    createdAt: Timestamp;
  }