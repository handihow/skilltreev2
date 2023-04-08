// import React from "react";
import { Box, CircularProgress, Container } from "@mui/material";
import { Entity } from "firecms";
import { IUser } from "../types/iuser.type";
import { UserEvaluations } from "../widgets/UserEvaluations";

export function UserEvaluationsView({ entity, compositionId }: {
    entity: Entity<IUser> | undefined,
    compositionId: string | undefined
}) {

    return (
        <Container maxWidth={"sm"} sx={{marginTop: "20px"}}>
            {entity ?
                <UserEvaluations userId={entity.id} compositionId={compositionId} /> : <CircularProgress />}
        </Container>
    );

}