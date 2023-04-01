
export type IEvaluation = {
    id?: string;
    type: "letter" | "numerical" | "percentage";
    grade?: number;
    percentage?: number;
    letter?: string;
    repeat?: boolean;
    comment?: string;
    student?: any;
    teacher?: any;
    composition?: any;
    skilltree?: any;
    skill?: any;
    evaluationModel?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
