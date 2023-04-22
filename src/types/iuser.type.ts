
export type IUser = {
    uid?: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    emailVerified?: boolean;
    standardFeedback?: string;
    hostedDomain?: string;
    provider?: string;
    creationTime?: any;
    lastSignInTime?: any;
    type?: string;
    organizations?: any[];
    subjects?: string;
    groups?: string;
    programs?: string;
}
