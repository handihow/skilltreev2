// import React from "react";
import { CircularProgress, Container } from "@mui/material";
import { useAuthController } from "firecms";
import { UserEvaluations } from "../widgets/UserEvaluations";

export function MyGrades() {
    // hook to do operations related to authentication
    const authController = useAuthController();

    return (
        <Container maxWidth={"sm"}>
                    {authController.user ?
                        <UserEvaluations userId={authController.user.uid} compositionId={undefined} /> : <CircularProgress />}
        </Container>
    );

}

