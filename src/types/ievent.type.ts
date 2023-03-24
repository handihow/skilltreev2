export type IEvent = {
    id?: string;
    title: string;
    start: any;
    end: any;
    disabled?: boolean;
    color?: string;
    editable?: boolean;
    deletable?: boolean;
    draggable?: boolean;
    allDay?: boolean;
    student?: any;
    teacher?: any;
    composition?: any;
    skilltree?: any;
    skill?: any;
    evaluationModel?: any;
    createdAt?: Date;
    updatedAt?: Date;
}