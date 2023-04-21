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
  instructorId?: string,
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
      if (status === "new") {
        if (!skillId || !studentId || !instructorId || !compositionId || !skilltreeId) throw new Error('Missing necessary information');
        const [path, error] = await getSkillPath(skillId);
        if (error || !path) throw new Error("Missing path info: " + error);
        values.student = new EntityReference(studentId, "users");
        values.instructor = new EntityReference(instructorId, "users");
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
    properties.instructor = {
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
    properties,
    permissions: ({ authController }) => ({
      edit: authController.extra?.permissions.comments.edit,
      create: authController.extra?.permissions.comments.create,
      // we have created the roles object in the navigation builder
      delete: authController.extra?.permissions.comments.delete
    }),
    callbacks: commentCallbacks
  })
}