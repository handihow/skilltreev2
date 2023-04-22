import { buildEntityCallbacks, EntityReference, EntityOnFetchProps } from "firecms";
import { updateSharedUserStatus } from "../../services/user.service";

export const compositionCallbacks = buildEntityCallbacks({
    onPreSave: ({
        entityId,
        values,
        status
    }) => {
        console.log('pre save composition record called');
        // return the updated values
        values.user = values.user.id;
        if(values.sharedUsers) {
            values.sharedUsers = values.sharedUsers.map((su: EntityReference) => su.id);
            updateSharedUserStatus(values.sharedUsers, values.id, status);
        }
        if(values.pendingApprovalUsers) {
            values.pendingApprovalUsers = values.pendingApprovalUsers.map((su: EntityReference) => su.id);
        }
        if(status !== "existing") {
            values.id = entityId;
        }
        return values;
    },
    
    onFetch({
        entity,
    }: EntityOnFetchProps) {
        entity.values.user = new EntityReference(entity.values.user, "users");
        if(entity.values.sharedUsers) {
            entity.values.sharedUsers = entity.values.sharedUsers.map((su: string) => new EntityReference(su, "users"))
        }
        if(entity.values.pendingApprovalUsers) {
            entity.values.pendingApprovalUsers = entity.values.pendingApprovalUsers.map((su: string) => new EntityReference(su, "users"))
        }
        return entity;
    },
});