import {
    buildCollection, buildEntityCallbacks, buildProperty, EntityOnDeleteProps, EntityOnSaveProps,
} from "firecms";
import { getCountFromPath } from "../services/firestore";
import { skillsCollectionWithSubcollections } from "./skill_collection";
import { MoveDownAction, MoveUpAction } from "../actions/move.actions";
import { deleteSkillsOfSkilltree, createSkilltreeSkills } from "../services/composition.service";

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

const skilltreeCallbacks = buildEntityCallbacks({
    onPreSave: async ({
        path,
        values,
        entityId,
        status
    }) => {
        // return the updated values
        if (status !== "existing") {
            const split = path.split("/");
            values.composition = split.length ? split[1] : "";
            values.order = await getCountFromPath(path);
            values.id = entityId;
        }
        return values;
    },
    onPreDelete: async ({
        entityId
    }: EntityOnDeleteProps<ISkilltree>
    ) => {
        const error = await deleteSkillsOfSkilltree(entityId);
        if(error) throw new Error(error);
    },
    onSaveSuccess: async (props: EntityOnSaveProps<ISkilltree>) => {
        if(props.status === "new") {
            const split = props.path.split("/");
            const compositionId = split.length ? split[1] : "";
            const error = await createSkilltreeSkills(props.entityId || "", compositionId, false);
            if(error) props.context.snackbarController.open({type: "error", message: error});
        }
    },
});


export const skilltreesCollection = buildCollection<ISkilltree>({
    name: "Trees",
    singularName: "Tree",
    path: "skilltrees",
    initialSort: ["order", "asc"],
    permissions: ({ authController }) => {
        const isStudent = authController.extra?.roles.includes("student");
        return ({
            edit: !isStudent,
            create: !isStudent,
            // we have created the roles object in the navigation builder
            delete: !isStudent
        })
    },
    Actions: [MoveDownAction, MoveUpAction],
    subcollections: [
        skillsCollectionWithSubcollections
    ],
    inlineEditing: false,
    defaultSize: "s",
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
            dataType: "boolean",
            defaultValue: true
        },
        closedByDefault: {
            name: "Closed by default",
            dataType: "boolean",
            defaultValue: false
        },
        disabled: {
            name: "Disabled",
            dataType: "boolean",
            defaultValue: false
        },
        order: {
            name: "Order",
            dataType: "number",
            readOnly: true
        },
        createdAt: buildProperty({
            dataType: "date",
            name: "Created at",
            autoValue: "on_create",
            readOnly: true
        }),
        updatedAt: buildProperty({
            dataType: "date",
            name: "Updated at",
            autoValue: "on_update",
            readOnly: true
        })
    },
    callbacks: skilltreeCallbacks
});
