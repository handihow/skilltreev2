import {
    buildProperty, buildCollection, EntityCollection,
} from "firecms";
import CustomImagePreview from '../custom_field_preview/ImagePreview';
import CustomHTMLPreview from "../custom_field_preview/HTMLPreview";
import { IconPrefix , IconName } from '@fortawesome/fontawesome-svg-core';

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
    links?: ILink[];
    order?: number;
    optional: boolean;
    direction?: string;
    countChildren: number;
    category?: string;
    reference?: string;
    //properties to track the parent and path
    parent?: any;
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
}

function skillsCollectionBuilder(level: number, hasSubcollections: boolean, description: string | undefined) : EntityCollection<ISkill> {
    let subcollections : EntityCollection<ISkill>[] | undefined;
    if(level < 5 && hasSubcollections) {
        subcollections = [skillsCollectionBuilder(level + 1, true, undefined)];
    }
    return buildCollection<ISkill>({
        name: "Skills",
        description,
        singularName: "Skill",
        path: "skills",
        group: "Content",
        subcollections,
        icon: "FormatListBulleted",
        permissions: ({ authController }) => ({
            edit: authController.extra?.includes("super"),
            create: authController.extra?.includes("super"),
            // we have created the roles object in the navigation builder
            delete: authController.extra?.includes("super")
        }),
        properties: {
            title: {
                name: "Title",
                validation: { required: true },
                dataType: "string"
            },
            description: {
                name: "Description",
                validation: { required: true },
                dataType: "string",
                Preview: CustomHTMLPreview
            },
            optional: {
                name: "Optional",
                validation: { required: true },
                dataType: "boolean"
            },
            countChildren: {
                name: "Children",
                dataType: "number"
            },
            icon: {
                name: "Icon",
                dataType: "string",
                Preview: CustomImagePreview
            },
            links: buildProperty({
                name: "Links",
                dataType: "array",
                of: buildProperty({
                    dataType: "map",
                    properties: {
                        title: {
                            name: "Title",
                            dataType: "string"
                        },
                        description: {
                            name: "Description",
                            dataType: "string"
                        },
                        imageUrl: {
                            name: "Image url",
                            dataType: "string",
                            Preview: CustomImagePreview
                        },
                        filename: {
                            name: "File name",
                            dataType: "string"
                        }
                    }
                }),
                expanded: true
            }),
            order: {
                name: "Order",
                dataType: "number"
            }
        }
    });
}

export const skillsCollection = skillsCollectionBuilder(0, false, "Manage all skills");
export const skillsCollectionWithSubcollections = skillsCollectionBuilder(0, true, undefined);