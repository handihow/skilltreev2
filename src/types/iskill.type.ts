import { IconPrefix, IconName } from '@fortawesome/fontawesome-svg-core';

type ILink = {
    id: string;
    iconName: IconName;
    iconPrefix: IconPrefix;
    reference: string;
    title: string;
    description?: string;
    imageUrl?: string;
    filename?: string;
}

export type ISkill = {
    id?: string;
    composition?: string;        //references the composition ID
    skilltree?: string;          //references the skilltree ID
    title: string;
    description?: string;
    icon?: string;
    image?: string;
    links?: ILink[];
    order?: number;
    optional: boolean;
    direction?: string;
    countChildren?: number;
    category?: string;
    reference?: string;
    //properties to track the parent and path
    parent?: string[];
    path?: string;
    hierarchy?: number;
    //properties to assist in loading into skilltree
    tooltip?: any;
    children?: ISkill[];
    //properties to assist in loading into treebeard
    name?: string;
    isSkill?: boolean;
    decorators?: any;
    toggled?: boolean;
    //properties to assist in loading into skills table
    compositionTitle?: string;
    table?: string;
    gradeSkill?: "default" | "not_graded" | "graded";
    weight?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
