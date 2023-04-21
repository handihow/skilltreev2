import {
    buildCollection,
    buildEntityCallbacks,
    buildProperties,
    buildProperty,
    EntityCollection,
    EntityReference,
} from "firecms";
import { chipColors } from "../common/StandardData";
import { getSkillPath } from "../services/composition.service";
import { IEvent } from "../types/ievent.type";

function addHours(date: Date, hours: number) {
    const endDate = new Date(date);
    endDate.setHours(endDate.getHours() + hours);
    
    return endDate;
  }

export function buildEventsCollection(
    view: "edit" | "table",
    instructorId?: string,
    studentIds?: string[],
    compositionId?: string,
    skilltreeId?: string,
    skillId?: string,
    skillTitle?: string
): EntityCollection<IEvent> {
    const eventCallbacks = buildEntityCallbacks({
        onPreSave: async ({
            values,
            status
        }) => {
            // return the updated values
            if (status === "new") {
                if(!skillId || !studentIds || !instructorId || ! compositionId || !skilltreeId) throw new Error('Missing necessary information');
                const [path, error] = await getSkillPath(skillId);
                if(error || !path) throw new Error("Missing path info: " + error);
                values.students = studentIds.map((studentId: string) => new EntityReference(studentId, "users"));
                values.instructor = new EntityReference(instructorId, "users");
                values.composition = new EntityReference(compositionId, "compositions");
                values.skilltree = new EntityReference(skilltreeId, "compositions/" + compositionId + "/skilltrees");
                values.plannedForGroup = studentIds.length > 1;
                const split = path.split("/");
                split.pop()
                values.skill = new EntityReference(skillId, split.join("/"));
            }
            values.end = addHours(values.start, 1);
            return values;
        },

    });

    let properties = buildProperties<any>({
        title: {
            dataType: "string",
            validation: { required: true},
            name: "Title",
            defaultValue: skillTitle
        },
        start: {
            dataType: "date",
            mode: "date_time",
            name: "Due date",
            validation: {required: true},
            defaultValue: new Date()
        },
        end: {
            dataType: "date",
            mode: "date_time",
            name: "End",
            disabled: view === "edit" ? {
                hidden: true
            } : undefined
        },
        disabled: {
            dataType: "boolean",
            name: "Disabled",
            defaultValue: false
        },
        editable: {
            dataType: "boolean",
            name: "Editable",
            defaultValue: true
        },
        deletable: {
            dataType: "boolean",
            name: "Deletable",
            defaultValue: true
        },
        draggable: {
            dataType: "boolean",
            name: "Draggable",
            defaultValue: false,
            disabled: {
                hidden: true
            }
        },
        color: {
            name: "Color",
            description: "Color of the label",
            dataType: "string",
            enumValues: chipColors,
        },
    });

    
    if (view === "table") {
        properties.skill = {
            name: "Skill",
            dataType: "reference",
            path: "skills",
            previewProperties: ["title"],
            readOnly: true
        }
        properties.students = {
            name: "Students",
            dataType: "array",
            of: {
                dataType: "reference",
                path: "users",
                previewProperties: ["displayName", "email"],
                readOnly: true
            }
        };
        properties.instructor = {
            name: "Teacher",
            dataType: "reference",
            path: "users",
            previewProperties: ["displayName", "email"],
            readOnly: true
        };
        properties.plannedForGroup = {
            name: "Group",
            dataType: "boolean"
        }
    }

    properties.createdAt = buildProperty({
        dataType: "date",
        name: "Created at",
        autoValue: "on_create",
        readOnly: true,
        disabled: {
            hidden: view === "edit"
        }
    });
    properties.updatedAt = buildProperty({
        dataType: "date",
        name: "Updated at",
        autoValue: "on_update",
        readOnly: true,
        disabled: {
            hidden: view === "edit"
        }
    });

    return buildCollection<IEvent>({
        name: "Events",
        description: "Events administration",
        singularName: "Event",
        path: "events",
        defaultSize: "s",
        group: "Administration",
        icon: "CalendarMonth",
        hideIdFromCollection: true,
        hideIdFromForm: true,
        inlineEditing: false,
        permissions: ({ authController }) => ({
            edit: authController.extra?.permissions.events.edit,
            create: authController.extra?.permissions.events.create,
            // we have created the roles object in the navigation builder
            delete: authController.extra?.permissions.events.delete
        }),
        properties,
        callbacks: eventCallbacks
    })
};