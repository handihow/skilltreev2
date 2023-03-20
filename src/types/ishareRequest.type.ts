
export type IShareRequest = {
    composition: any;
    requester?: any;
    approver?: any;
    requestApproved?: boolean;
    approvalComment?: string;
    createdAt: Date;
    updatedAt: Date;
}
