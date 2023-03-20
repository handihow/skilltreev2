
export type ISkilltree = {
    id?: string
    title: string;
    description?: string;
    collapsible?: boolean;
    closedByDefault?: boolean;
    disabled?: boolean;
    order?: number;
    composition?: string; //references the parent composition ID
    //make it compatible with skilltree
    data?: any;
    //make it compatible with treebeard
    name?: string;
    isSkill?: boolean;
    toggled?: boolean;
    children?: any;
    decorators?: any;
    countChildren?: number;
    path?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
