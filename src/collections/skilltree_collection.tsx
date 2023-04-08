import {
    buildCollection, buildEntityCallbacks, buildProperty, EntityCollection, EntityOnDeleteProps, EntityOnSaveProps,
} from "firecms";
import { getCountFromPath } from "../services/firestore";
import { skillsCollectionWithSubcollections } from "./skill_collection";
import { MoveDownAction, MoveUpAction } from "../actions/move.actions";
import { deleteSkillsOfSkilltree, createSkilltreeSkills } from "../services/composition.service";
import { ISkilltree } from "../types/iskilltree.type";

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
        if (error) throw new Error(error);
    },
    onSaveSuccess: async (props: EntityOnSaveProps<ISkilltree>) => {
        if (props.status === "new") {
            const split = props.path.split("/");
            const compositionId = split.length ? split[1] : "";
            const error = await createSkilltreeSkills(props.entityId || "", compositionId, false);
            if (error) props.context.snackbarController.open({ type: "error", message: error });
        }
    },
});

export function buildSkilltreesCollection(withSubCollections: boolean): EntityCollection<ISkilltree> {
    const subcollections = withSubCollections ? [skillsCollectionWithSubcollections] : [];
    return buildCollection<ISkilltree>({
        name: "Trees",
        singularName: "Tree",
        path: "skilltrees",
        initialSort: ["order", "asc"],
        permissions: {
            edit: true,
            create: true,
            delete: true
        },
        Actions: [MoveDownAction, MoveUpAction],
        subcollections,
        inlineEditing: false,
        hideIdFromCollection: true,
        hideIdFromForm: true,
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
                disabled: {
                    hidden: true
                }
            },
            createdAt: buildProperty({
                dataType: "date",
                name: "Created at",
                autoValue: "on_create",
                disabled: {
                    hidden: true
                }
            }),
            updatedAt: buildProperty({
                dataType: "date",
                name: "Updated at",
                autoValue: "on_update",
                disabled: {
                    hidden: true
                }
            })
        },
        callbacks: skilltreeCallbacks
    })
};
