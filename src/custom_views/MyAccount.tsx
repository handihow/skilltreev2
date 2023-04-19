// import React from "react";
import { Avatar, Box, Button, Card, CardActions, CardContent, CardHeader, Container, Typography } from "@mui/material";
import { useAuthController, useModeController, useSideEntityController, useSnackbarController } from "firecms";
import { linkAccount, removeUser } from "../services/user.service";
import { editRecordCollection } from "../collections/user/user_collection";
import AlertDialog from "../widgets/AlertDialog";
import LoginIcon from '@mui/icons-material/Login';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { green, red } from "@mui/material/colors";

export function MyAccount() {
    // hook to do operations related to authentication
    const authController = useAuthController();
    const snackbarController = useSnackbarController();
    const modeController = useModeController();
    const sideEntityController = useSideEntityController();

    const linkUserAccount = async (provider: "Google" | "Microsoft", link: boolean) => {
        const error = await linkAccount(provider, link);
        if (error) return snackbarController.open({ type: "error", message: error });
        const providerIds: string[] = authController.extra?.providerIds || [];
        if (link && provider === "Google") {
            providerIds.push("google.com");
        } else if (link && provider === "Microsoft") {
            providerIds.push("microsoft.com");
        } else if (provider === "Google") {
            const googleIndex = providerIds.findIndex((pr: string) => pr === "google.com");
            if (googleIndex > -1) providerIds.splice(googleIndex, 1);
        } else if (provider === "Microsoft") {
            const msIndex = providerIds.findIndex((pr: string) => pr === "microsoft.com");
            if (msIndex > -1) providerIds.splice(msIndex, 1);
        }
        authController.setExtra({ providerIds })
        const addedText = link ? "linked " : "unlinked "
        snackbarController.open({ type: "success", message: "Successfully " + addedText + provider })
    }

    const editUserAccount = () => {
        sideEntityController.open({
            path: "users",
            collection: editRecordCollection,
            entityId: authController.user?.uid
        })
    }


    function stringToColor(string: string) {
        let hash = 0;
        let i;
      
        /* eslint-disable no-bitwise */
        for (i = 0; i < string.length; i += 1) {
          hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
      
        let color = '#';
      
        for (i = 0; i < 3; i += 1) {
          const value = (hash >> (i * 8)) & 0xff;
          color += `00${value.toString(16)}`.slice(-2);
        }
        /* eslint-enable no-bitwise */
      
        return color;
      }
      
      function stringAvatar(name: string | null | undefined) {
        let str = "Anonymous"
        if(typeof name === 'string') str = name        
        return {
          sx: {
            bgcolor: stringToColor(str),
          },
          children: `${str.split(' ')[0][0]}`,
        };
      }

    const removeAccount = async () => {
        const error = await removeUser();
        if(error) snackbarController.open({
            type: "error",
            message: error
        });
    }

    return (
        <Container maxWidth={"lg"}>
            <Box
                width={"100%"}
                height={"100%"}>

                <Box m="auto"
                    display="flex"
                    flexDirection={"row"}
                    alignItems={"top"}
                    justifyItems={"top"}
                >
                    <Card sx={{ m: 1, width: "350px" }}>
                        <CardHeader
                             avatar={
                                authController.user?.photoURL ? 
                                <Avatar alt="profile picture" src={authController.user?.photoURL} /> : 
                                <Avatar {...stringAvatar(authController.user?.displayName)} />
                            }
                            title={authController.user?.displayName || "Anonymous"}
                            subheader={authController.user?.email || "No email"}
                        />
                        <CardContent>
                            <Typography>
                                Edit your display name, organization and roles.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button
                                color={modeController.mode === "dark" ? "secondary" : "primary"}
                                onClick={editUserAccount}>
                                Edit</Button>
                        </CardActions>

                    </Card>
                    <Card sx={{ m: 1, width: "350px" }}>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: green[500] }}><LoginIcon /></Avatar>
                            }
                            title="Federated providers"
                        />
                        <CardContent>
    
                            <Typography>
                                Link or unlink your account to federated identity providers.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button
                                color={modeController.mode === "dark" ? "secondary" : "primary"}
                                onClick={() => linkUserAccount('Google', !authController.extra?.providerIds.includes("google.com"))}>
                                {authController.extra?.providerIds.includes("google.com") ? "Unlink Google" : "Link Google"}</Button>
                            <Button
                                color={modeController.mode === "dark" ? "secondary" : "primary"}
                                onClick={() => linkUserAccount('Microsoft', !authController.extra?.providerIds.includes("microsoft.com"))}>
                                {authController.extra?.providerIds.includes("microsoft.com") ? "Unlink Microsoft" : "Link Microsoft"}</Button>
                        </CardActions>
                    </Card>
                    <Card sx={{ m: 1, width: "350px" }}>
                    <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: red[500] }}><PersonRemoveIcon /></Avatar>
                            }
                            title="Delete account"
                        />
                        <CardContent>
                            <Typography>
                                Delete your account from EasySkillTree.com permanently.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <AlertDialog
                                agreeFunction={removeAccount}
                                functionParams={{}}
                                agreeBtnText="Yes, delete!"
                                openBtnText="Delete"
                                alertWarning="Are you sure that you want to delete your account?"
                                btnColor="error"
                            />
                        </CardActions>
                    </Card>
                </Box>
            </Box>
        </Container>
    );

}
