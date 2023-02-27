import React, { useCallback } from "react";

import { User as FirebaseUser } from "firebase/auth";
import {
    Authenticator,
    CMSView,
    FirebaseCMSApp,
} from "firecms";

import { db } from "./services/firestore";
import { getDocs, collection } from "firebase/firestore";

import "typeface-rubik";
import "@fontsource/ibm-plex-mono";

import { usersCollection } from "./collections/user_collection";
import { compositionsCollection } from "./collections/composition_collection";
import { organizationCollection } from "./collections/organization_collection";
import { firebaseConfig } from "./firebase_config";
import { skillsCollection } from "./collections/skill_collection";
import { MySkillTreesView } from "./custom_views/MySkillTrees";
import { SkillTreeViewer } from "./custom_views/SkillTreeViewer";
import { IconButton, Tooltip } from "@mui/material";
import { GitHub } from "@mui/icons-material";

import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
library.add(fas)
library.add(fab)

const customViews: CMSView[] = [
    {
        path: "own-skilltrees",
        name: "My SkillTrees",
        group: "Content",
        description: "Your SkillTrees",
        view: <MySkillTreesView view={"owned"} />,
        icon: "Copyright"
    },
    {
        path: "shared-skilltrees",
        name: "Shared SkillTrees",
        group: "Content",
        description: "SkillTrees shared with you",
        view: <MySkillTreesView view={"shared"} />,
        icon: "Share"
    },
    {
        path: "compositions/:id/viewer",
        name: "SkillTree Viewer",
        hideFromNavigation: true,
        description: "SkillTree Viewer",
        view: <SkillTreeViewer />
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

    const myAuthenticator: Authenticator<FirebaseUser> = useCallback(async ({
        user,
        authController
    }) => {

        // if (!user?.email?.includes("flanders")) {
        //     throw Error("No access!");
        // }

        console.log("Allowing access to", user?.email);
        const userRolesRef = collection(db, 'users/' + user?.uid + '/roles')
        // This is an example of retrieving async data related to the user
        // and storing it in the user extra field.
        const sampleUserRolesSnap = await getDocs(userRolesRef);
        const roles = sampleUserRolesSnap.docs.map(d => { 
            if(d.data().hasRole) {
                return d.id
            } else {
                return "";
            }
        });
        console.log(roles)
        authController.setExtra(roles);

        return true;
    }, []);

    return <FirebaseCMSApp
        name={"SkillTree"}
        authentication={myAuthenticator}
        views={customViews}
        collections={({authController}) => authController.extra?.includes("super") ? [usersCollection, organizationCollection, compositionsCollection, skillsCollection] : []} 
        firebaseConfig={firebaseConfig}
        signInOptions={['google.com', 'microsoft.com', 'password']}
        toolbarExtraWidget={githubLink}
        logo="https://firebasestorage.googleapis.com/v0/b/skilltree-b6bba.appspot.com/o/assets%2FSkillTreeIcon.png?alt=media&token=af824f13-6bfd-46f9-9ec8-35ff020e95c6"
        logoDark="https://firebasestorage.googleapis.com/v0/b/skilltree-b6bba.appspot.com/o/assets%2FSkillTree_T_icon.png?alt=media&token=06b80792-f01a-4cfc-9de4-0f89f6d1b3c0"
        primaryColor="#27405f"
        secondaryColor="#8a4d76"
        fontFamily="Nunito"
    />;
}
