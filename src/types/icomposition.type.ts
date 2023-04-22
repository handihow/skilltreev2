import { DocumentReference } from "firebase/firestore";
import { SkillThemeType } from "../widgets/BST";

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
    groups?: DocumentReference[];
    pendingApprovalUsers?: string[];
    // sharedWith?: EntityReference[];
    lastUpdate?: any;
    url?: string;
    evaluationModel?: any;
    gradeAllSkillsByDefault?: boolean;
    pendingApproval?: boolean;
    isGroupStudent?: boolean;
    createdAt?: Date;
}
