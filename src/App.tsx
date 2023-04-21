import { useCallback, useState } from "react";

import { User as FirebaseUser } from "firebase/auth";
import {
    Authenticator,
    CMSView,
    EntityCollection,
    FirebaseCMSApp,
} from "firecms";

import { loadFonts } from "./services/fonts";
loadFonts();
import "typeface-rubik";
import "@fontsource/ibm-plex-mono";

import { getUserOrganization, getUserPermissions, getUserRoles, updateUser } from "./services/user.service";

import { buildUsersCollection } from "./collections/user/user_collection";
import { buildAdminCompositionsCollection } from "./collections/composition/composition_collection";
import { buildGroupCollection, buildOrganizationCollection } from "./collections/organization_collection";
import { firebaseConfig } from "./firebase_config";
import { buildShareRequestCollection } from "./collections/share_request_collection";
import { MySkillTreesView } from "./custom_views/MySkillTrees";
import { SkillTreeViewer } from "./custom_views/SkillTreeViewer";
import { SkillTreeEditor } from "./custom_views/SkillTreeEditor";
import { ShareRequestsView } from "./custom_views/ShareRequests";
import { IconButton, Tooltip } from "@mui/material";
import { GitHub } from "@mui/icons-material";

import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { buildEvaluationModelCollection } from "./collections/evaluation_model_collection";
import { buildEvaluationsCollection } from "./collections/evaluation_collection";
import { buildEventsCollection } from "./collections/event_collection";
import { ShareSkillTreeView } from "./custom_views/ShareSkillTree";
import { MySchedule } from "./custom_views/MySchedule";
import { MyGrades } from "./custom_views/MyGrades";
import { MyAccount } from "./custom_views/MyAccount";
import { permissionsCollection } from "./collections/permission_collection";
import { CustomLoginView } from "./custom_views/CustomLoginView";
import { ToolbarExtraWidget } from "./widgets/ToolbarExtraWidget";
library.add(fas)
library.add(fab)

const customViews: CMSView[] = [
    {
        path: "own-skilltrees",
        name: "My SkillTrees",
        group: "Content",
        description: "Your SkillTrees",
        view: <MySkillTreesView view={"owned"} />,
        icon: "Nature"
    },
    {
        path: "shared-skilltrees",
        name: "Shared SkillTrees",
        group: "Content",
        description: "SkillTrees shared with you",
        view: <MySkillTreesView view={"shared"} />,
        icon: "NaturePeople"
    },
    {
        path: "my-account",
        name: "My Account",
        group: "Account",
        description: "Your account",
        view: <MyAccount />,
        icon: "AccountCircle"
    },
    {
        path: "compositions/:id/viewer",
        name: "SkillTree Viewer",
        hideFromNavigation: true,
        description: "SkillTree Viewer",
        view: <SkillTreeViewer />
    },
    {
        path: "compositions/:id/grades",
        name: "SkillTree Viewer",
        hideFromNavigation: true,
        description: "SkillTree Viewer",
        view: <SkillTreeViewer />
    },
    {
        path: "compositions/:id/editor",
        name: "SkillTree Editor",
        hideFromNavigation: true,
        description: "SkillTree Editor",
        view: <SkillTreeEditor />
    },
    {
        path: "compositions/:id/share",
        name: "Share SkillTree",
        hideFromNavigation: true,
        description: "Share SkillTree",
        view: <ShareSkillTreeView />
    },
    {
        path: "share_requests/:id",
        name: "Share requests",
        hideFromNavigation: true,
        description: "Share requests for composition",
        view: <ShareRequestsView />
    }
];

export default function App() {

    const githubLink = (
        <Tooltip
            title="See this project on GitHub">
            <IconButton
                href={"https://github.com/handihow/skilltreev2"}
                rel="noopener noreferrer"
                target="_blank"
                component={"a"}
                size="large">
                <GitHub />
            </IconButton>
        </Tooltip>
    );

    const [collections, setCollections] = useState<EntityCollection[]>([]);

    const myAuthenticator: Authenticator<FirebaseUser> = useCallback(async ({
        user,
        authController
    }) => {

        // if (!user?.email?.includes("flanders")) {
        //     throw Error("No access!");
        // }

        console.log("Allowing access to", user?.email);
        const error = await updateUser(user);
        if(error) throw Error(error);
        const [roles, error1] = await getUserRoles(user?.uid || "")
        if(error1) throw Error(error1)
        const [organization, error2] = await getUserOrganization(user?.uid || "")
        if(error2) throw Error(error2)
        const providerIds = user?.providerData.map(provider => provider.providerId);
        const [permissions, error3] = await getUserPermissions(roles ? roles : ["instructor"]);
        if(error3) throw Error(error3)
        authController.setExtra({roles, organization, providerIds, permissions});
        console.log(permissions);
        if(roles && roles.includes("super") && user) {
            setCollections([
                buildEvaluationModelCollection(true), 
                buildEvaluationsCollection("evaluations"),
                buildEventsCollection("table"),
                buildGroupCollection(organization),
                buildOrganizationCollection(permissions?.organizations?.view || false),
                permissionsCollection,
                buildShareRequestCollection("admin", user),
                buildAdminCompositionsCollection(), 
                buildUsersCollection("admin"),
            ])
        } else if(roles && roles.includes("admin") && organization){
            setCollections([
                buildEvaluationModelCollection(true),
                buildGroupCollection(organization),
                buildOrganizationCollection(permissions?.organizations?.view || false),
                buildAdminCompositionsCollection(organization), 
                buildUsersCollection("admin", organization),
            ])
        } else if(roles && roles.includes("instructor") && organization){
            setCollections([
                buildEvaluationModelCollection(permissions?.evaluation_models?.view || false), 
                buildOrganizationCollection(permissions?.organizations?.view || false),
                buildUsersCollection("instructor", organization)])
        } else {
            setCollections([
                buildEvaluationModelCollection(permissions?.evaluation_models?.view || false), 
                buildOrganizationCollection(permissions?.organizations?.view || false)])
        }
        if(roles && roles.includes("student")){
            customViews.push(
                {
                    path: "my-schedule",
                    name: "My Schedule",
                    group: "Content",
                    description: "Your schedule",
                    view: <MySchedule />,
                    icon: "Today"
                },
                {
                    path: "my-grades",
                    name: "My Grades",
                    group: "Grades",
                    description: "Your grades",
                    view: <MyGrades />,
                    icon: "Grading"
                },
            )
        }
        return true;
    }, []);

    return <FirebaseCMSApp
        name={"SkillTree"}
        authentication={myAuthenticator}
        views={customViews}
        collections={collections} 
        firebaseConfig={firebaseConfig}
        signInOptions={['google.com', 'microsoft.com', 'password', 'anonymous']}
        LoginView={CustomLoginView}
        toolbarExtraWidget={ToolbarExtraWidget()}
        logo="https://firebasestorage.googleapis.com/v0/b/skilltree-b6bba.appspot.com/o/assets%2FSkillTreeIcon.png?alt=media&token=af824f13-6bfd-46f9-9ec8-35ff020e95c6"
        logoDark="https://firebasestorage.googleapis.com/v0/b/skilltree-b6bba.appspot.com/o/assets%2FSkillTree_T_icon.png?alt=media&token=06b80792-f01a-4cfc-9de4-0f89f6d1b3c0"
        primaryColor="#27405f"
        secondaryColor="#fffff"
        fontFamily="Nunito"
    />;
}


