import { SkillThemeType } from "beautiful-skill-tree";

export type IComposition = {
    id?: string;
    title: string;
    // owner?: EntityReference;
    user?: string; //refers to user uid
    username?: string; //refers to user email
    theme?: SkillThemeType;
    backgroundImage?: string;
    // loggedInUsersOnly?: boolean;
    loggedInUsersCanEdit?: boolean;
    canCopy?: boolean;
    requireShareApproval?: boolean;
    sharedUsers?: string[];
    pendingApprovalUsers?: string[];
    // sharedWith?: EntityReference[];
    lastUpdate?: any;
    url?: string;
    evaluationModel?: any;
    gradeAllSkillsByDefault?: boolean;
    pendingApproval?: boolean;
    createdAt?: Date;
}
