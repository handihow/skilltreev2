import {
  buildCollection,
  buildEntityCallbacks,
  buildProperties,
  buildProperty,
  EntityCollection,
  EntityReference,
} from "firecms";
import { getSkillPath } from "../services/composition.service";
import { IComment } from "../types/icomment.type";

export function buildCommentsCollection(
  view: "edit" | "table",
  teacherId?: string,
  studentId?: string,
  compositionId?: string,
  skilltreeId?: string,
  skillId?: string
): EntityCollection<IComment> {
  const commentCallbacks = buildEntityCallbacks({
    onPreSave: async ({
      values,
      status
    }) => {
      console.log("I am running")
      console.log(status, "status")
      if (status === "new") {
        console.log("I got inside the block")
        if (!skillId || !studentId || !teacherId || !compositionId || !skilltreeId) throw new Error('Missing necessary information');
        const [path, error] = await getSkillPath(skillId);
        if (error || !path) throw new Error("Missing path info: " + error);
        values.student = new EntityReference(studentId, "users");
        values.teacher = new EntityReference(teacherId, "users");
        values.composition = new EntityReference(compositionId, "compositions");
        values.skilltree = new EntityReference(skilltreeId, "compositions/" + compositionId + "/skilltrees");
        const split = path.split("/");
        split.pop()
        values.skill = new EntityReference(skillId, split.join("/"));
      }
      return values;
    }
  });

  let properties = buildProperties<any>({
    comment: {
      name: "Comment",
      dataType: "string",
      validation: { required: true },
      markdown: true,
      description: "Write something here that describes your problem"
    },
    labels: {
      name: "Labels",
      dataType: "array",
      of: {
        dataType: "string",
        enumValues: {
          "question": { id: "question", label: "Question", color: "blueDark" },
          "ineedhelp": { id: "ineedhelp", label: "I Need Help", color: "pinkLight" }
        }
      }
    }
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
    properties.composition = {
      name: "Composition",
      dataType: "reference",
      path: "compositions",
      previewProperties: ["title"],
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

  return buildCollection<IComment>({
    name: "Comments",
    description: "Manage comments",
    singularName: "Comment",
    path: "comments",
    defaultSize: "s",
    group: "Comments",
    icon: "Comment",
    permissions: ({ authController }) => ({
      edit: true,
      create: true,
      delete: authController.extra?.roles?.includes('super')
    }),
    properties,
    callbacks: commentCallbacks
  })
}