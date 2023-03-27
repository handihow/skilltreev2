// import React from "react";
import { Box, CircularProgress } from "@mui/material";
import { useAuthController } from "firecms";
import { UserScheduler } from "../widgets/UserScheduler";

export function MySchedule() {
    // hook to do operations related to authentication
    const authController = useAuthController();

    return (
        <Box
            display="flex"
            width={"100%"}
            height={"100%"}>

            <Box m="auto"
                display="flex"
                flexDirection={"column"}
                alignItems={"center"}
                justifyItems={"center"}>

                <Box p={1}>
                    {authController.user ?
                        <UserScheduler userId={authController.user.uid} compositionId={undefined} /> : <CircularProgress />}
                </Box>

            </Box>
        </Box>
    );

}