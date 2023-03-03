import {
    buildCollection,
} from "firecms";
import { skillsCollectionWithSubcollections } from "./skill_collection";

export type ISkilltree = {
    id?: string
    title: string;
    description?: string;
    collapsible?: boolean;
    order: number;
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
}


export const skilltreesCollection = buildCollection<ISkilltree>({
    name: "Skilltrees",
    singularName: "Skilltree",
    path: "skilltrees",
    initialSort: ["order", "asc"],
    permissions: ({ authController }) => {
        const isAdmin = authController.extra?.includes("admin") || authController.extra?.includes("super");
        return ({
            edit: isAdmin,
            create: false,
            // we have created the roles object in the navigation builder
            delete: false
        })
    },
    subcollections: [
        skillsCollectionWithSubcollections
    ],
    properties: {
        title: {
            name: "Title",
            validation: { required: true },
            dataType: "string"
        },
        description: {
            name: "Description",
            dataType: "string"
        },
        collapsible: {
            name: "Collapsible",
            dataType: "boolean"
        },
        order: {
            name: "Order",
            validation: { required: true },
            dataType: "number"
        }
    }
});
