export type IEvaluationModel = {
    id?: string;
    name: string;
    type: "numerical" | "percentage" | "letter";
    minimum?: number;
    maximum?: number;
    options?: any[];
    repeatOption?: any;
    createdAt?: Date;
    updatedAt?: Date;
}