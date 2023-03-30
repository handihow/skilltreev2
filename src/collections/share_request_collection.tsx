import { buildCollection, buildEntityCallbacks, buildProperty, EntityCollection, EntityOnFetchProps, EntityReference, User } from "firecms";
import { getComposition } from "../services/composition.service";
import { addOrRemoveSharedUser, addOrRemovePendingApprovalUser } from "../services/user.service";
import { IShareRequest } from "../types/ishareRequest.type";

export function buildShareRequestCollection(mode: "requesting" | "approving" | "admin", user: User, id?: string): EntityCollection<IShareRequest> {
    const shareRequestCallbacks = buildEntityCallbacks({
        onPreSave: async ({
            values,
        }) => {
            
            if(mode === "requesting") {
                values.requester = user.uid;
                const [composition, error] = await getComposition(values.composition);
                if(error || !composition) throw new Error("No SkillTree found with this id, please check the ID and try again.")
                if(!composition.requireShareApproval) {
                    values.requestApproved = true;
                    values.approvalComment = "Share request accepted automatically";
                    const error2 = await addOrRemoveSharedUser(user.uid, composition?.id || "", true)
                    if(error2) throw new Error(error2);
                } else {
                    const error3 = await addOrRemovePendingApprovalUser(user.uid, composition?.id || "")
                    if(error3) throw new Error(error3);
                }
            } else if(mode === "admin") {
                // return the updated values
                values.requester = values.requester.id;
                values.approver = user.uid;
                values.composition = values.composition.id;
                if(values.requestApproved) {
                    values.requestApproved = true;
                    const [composition, error] = await getComposition(values.composition);
                    if(error || !composition) throw new Error("No SkillTree found with this id, please check the ID and try again.")
                    const error2 = await addOrRemoveSharedUser(user.uid, composition?.id || "", true)
                    if(error2) throw new Error(error2);
                    const error3 = await addOrRemovePendingApprovalUser(user.uid, composition?.id || "", false);
                    if(error3) throw new Error(error3);
                }
            }
            return values;
        },
        
        onFetch({
            entity,
        }: EntityOnFetchProps) {
            if(entity.values.requester) entity.values.requester = new EntityReference(entity.values.requester, "users");
            if(entity.values.approver) entity.values.approver = new EntityReference(entity.values.approver, "users");
            entity.values.composition = new EntityReference(entity.values.composition, "compositions");
            return entity;
        },
    });

    let shareRequestCollection = buildCollection<IShareRequest>({
        name: "Share requests",
        description: "Manage share requests",
        singularName: "Share request",
        defaultSize: "s",
        path: "share_requests",
        group: "Administration",
        icon: "Share",
        permissions: ({ authController }) => ({
            edit: true,
            create: mode !== "admin",
            // we have created the roles object in the navigation builder
            delete: authController.extra?.roles?.includes('super')
        }),
        forceFilter: id ? {composition: ["==", id]} : undefined,
        properties: {
            composition: {
                dataType: "string",
                name: "Code",
                description: "Enter SkillTree Identification Code",
                validation: {required: true},
            },
            createdAt: buildProperty({
                dataType: "date",
                name: "Created at",
                autoValue: "on_create",
                readOnly: true,
                disabled: {
                    hidden: mode === "requesting"
                }
            }),
            updatedAt: buildProperty({
                dataType: "date",
                name: "Updated at",
                autoValue: "on_update",
                readOnly: true,
                disabled: {
                    hidden: mode === "requesting"
                }
            })
        },
        callbacks: shareRequestCallbacks,
        initialSort: ["updatedAt", "desc"]
    });
    if(mode !== "requesting") {
        shareRequestCollection.properties = {
            composition: buildProperty({
                dataType: "reference",
                path: "compositions",
                name: "SkillTree",
                previewProperties: ["title"],
                readOnly: true
            }),
            requester: buildProperty({
                dataType: "reference",
                path: "users",
                name: "Requester",
                previewProperties: ["displayName", "email"],
                readOnly: true
            }),
            requestApproved: {
                dataType: "boolean",
                name: "Approved?"
            },
            approver: buildProperty({
                dataType: "reference",
                path: "users",
                name: "Approved by",
                previewProperties: ["displayName", "email"],
                readOnly: true
            }),
            approvalComment: {
                dataType: "string",
                name: "Comment (not required)"
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
        };
    }
    if(mode === "approving") {
        shareRequestCollection.properties.approver = buildProperty({
            dataType: "reference",
            path: "users",
            name: "Approver",
        })
    }
    return shareRequestCollection;
}