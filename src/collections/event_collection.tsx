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
    date.setHours(date.getHours() + hours);
  
    return date;
  }

export function buildEventsCollection(
    view: "edit" | "table",
    teacherId?: string,
    studentId?: string,
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
                if(!skillId || !studentId || !teacherId || ! compositionId || !skilltreeId) throw new Error('Missing necessary information');
                const [path, error] = await getSkillPath(skillId);
                if(error || !path) throw new Error("Missing path info: " + error);
                values.student = new EntityReference(studentId, "users");
                values.teacher = new EntityReference(teacherId, "users");
                values.composition = new EntityReference(compositionId, "compositions");
                values.skilltree = new EntityReference(skilltreeId, "compositions/" + compositionId + "/skilltrees");
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
        properties.student = {
            name: "Student",
            dataType: "reference",
            path: "users",
            previewProperties: ["displayName", "email"],
            readOnly: true
        };
        properties.teacher = {
            name: "Teacher",
            dataType: "reference",
            path: "users",
            previewProperties: ["displayName", "email"],
            readOnly: true
        }
    }

    properties.createdAt = buildProperty({
        dataType: "date",
        name: "Created at",
        autoValue: "on_create",
        disabled: {
            hidden: view === "edit"
        }
    });
    properties.updatedAt = buildProperty({
        dataType: "date",
        name: "Updated at",
        autoValue: "on_update",
        disabled: {
            hidden: view === "edit"
        }
    });

    return buildCollection<IEvent>({
        name: "Events",
        description: "Manage events",
        singularName: "Event",
        path: "events",
        defaultSize: "s",
        group: "Schedule",
        icon: "CalendarMonth",
        permissions: ({ authController }) => ({
            edit: !authController.extra?.roles?.includes('student'),
            create: false,
            // we have created the roles object in the navigation builder
            delete: authController.extra?.roles?.includes('super')
        }),
        properties,
        callbacks: eventCallbacks
    })
};