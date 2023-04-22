// import React from "react";
import { Box, CircularProgress, Container } from "@mui/material";
import { useAuthController } from "firecms";
import { UserScheduler } from "../widgets/UserScheduler";

export function MySchedule() {
    // hook to do operations related to authentication
    const authController = useAuthController();

    return (
        <Container maxWidth={"lg"}
        >
            {authController.user ?
                <UserScheduler userId={authController.user.uid} compositionId={undefined} /> : <CircularProgress />}
        </Container>
    );

}