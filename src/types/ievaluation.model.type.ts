type LetterOption = {
    letter: string;
    description: string;
    color: string;
    value: number;
    minimum: number;
    maximum: number;
    valuePasses: boolean;
}

type RepeatOption = {
    letter: string;
    description: string;
    color: string;
}

export type IEvaluationModel = {
    id?: string;
    name: string;
    type: "numerical" | "percentage" | "letter";
    minimum?: number;
    maximum?: number;
    passLevel?: number;
    options?: LetterOption[];
    repeatOption?: RepeatOption;
    createdAt?: Date;
    updatedAt?: Date;
}