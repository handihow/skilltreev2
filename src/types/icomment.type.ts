export type IComment = {
    id?: string;
    title: string;
    description?: string,
    disabled?: boolean;
    color?: string;
    editable?: boolean;
    deletable?: boolean;
    student?: any;
    instructor?: any;
    composition?: any;
    skilltree?: any;
    skill?: any;
    createdAt?: Date;
    updatedAt?: Date;
  }