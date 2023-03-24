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

import { getUserOrganization, getUserRoles, updateUser } from "./services/user.service";

import { buildUsersCollection } from "./collections/user_collection";
import { buildCompositionsCollection } from "./collections/composition_collection";
import { organizationCollection } from "./collections/organization_collection";
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
import { evaluationModelCollection } from "./collections/evaluation_model_collection";
import { buildEvaluationsCollection } from "./collections/evaluation_collection";
import { buildEventsCollection } from "./collections/event_collection";
import { ShareSkillTreeView } from "./custom_views/ShareSkillTree";
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
                href={"https://github.com/handihow/skilltree"}
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
        // if(error1) throw Error(error1)
        const [organization, error2] = await getUserOrganization(user?.uid || "")
        if(error2) throw Error(error2)
        authController.setExtra({roles, organization});
        if(roles && roles.includes("super") && user) {
            setCollections([
                buildCompositionsCollection(false), 
                buildUsersCollection("admin"), 
                buildShareRequestCollection("admin", user),
                evaluationModelCollection, 
                buildEvaluationsCollection("evaluations"),
                buildEventsCollection("table"),
                organizationCollection,
            ])
        } else if(roles && roles.includes("admin") && organization){
            setCollections([
                buildCompositionsCollection(false, organization), 
                buildUsersCollection("admin", organization), 
                evaluationModelCollection,
            ])
        } else if(roles && roles.includes("admin")){
            setCollections([
                evaluationModelCollection,
            ])
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
        toolbarExtraWidget={githubLink}
        logo="https://firebasestorage.googleapis.com/v0/b/skilltree-b6bba.appspot.com/o/assets%2FSkillTreeIcon.png?alt=media&token=af824f13-6bfd-46f9-9ec8-35ff020e95c6"
        logoDark="https://firebasestorage.googleapis.com/v0/b/skilltree-b6bba.appspot.com/o/assets%2FSkillTree_T_icon.png?alt=media&token=06b80792-f01a-4cfc-9de4-0f89f6d1b3c0"
        primaryColor="#27405f"
        secondaryColor="#8a4d76"
        fontFamily="Nunito"
    />;
}


