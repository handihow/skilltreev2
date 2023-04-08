// import React from "react";
import { Box, Button, Card, CardActionArea, CardActions, CardContent, CardMedia, Container, Typography } from "@mui/material";
import { useAuthController, useModeController, useSnackbarController } from "firecms";
import { linkAccount } from "../services/user.service";

export function MyAccount() {
    // hook to do operations related to authentication
    const authController = useAuthController();
    const snackbarController = useSnackbarController();
    const modeController = useModeController();

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
    }

    return (
        <Container maxWidth={"md"}>
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
                        <CardActionArea>
                            {authController.user?.photoURL && <CardMedia
                                component="img"
                                height="200"
                                image={authController.user?.photoURL}
                                alt="profile picture"
                            />}
                            <CardContent>
                                <Typography gutterBottom variant="h5" component="div">
                                    {authController.user?.displayName || "Anonymous"}
                                </Typography>
                                <Typography gutterBottom variant="h6" component="div" color="text.secondary">
                                    {authController.user?.email || "No email"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Click on the card to edit your account.
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                    <Card sx={{ m: 1, width: "350px" }}>
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                Federated providers
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
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
                </Box>
            </Box>
        </Container>
    );

}
