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
    students?: any;
    teacher?: any;
    composition?: any;
    skilltree?: any;
    skill?: any;
    evaluationModel?: any;
    plannedForGroup?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}