// import React from "react";
import { Box, CircularProgress, Container } from "@mui/material";
import { Entity } from "firecms";
import { IUser } from "../types/iuser.type";
import { UserScheduler } from "../widgets/UserScheduler";

export function UserSchedulerView({ entity, compositionId }: {
    entity: Entity<IUser> | undefined,
    compositionId: string | undefined
}) {

    return (
        <Container maxWidth={"md"}>

                    {entity ?
                        <UserScheduler userId={entity.id} compositionId={compositionId} /> : <CircularProgress />}

       </Container>
    );

}