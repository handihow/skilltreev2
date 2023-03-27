// import React from "react";
import { Box, CircularProgress } from "@mui/material";
import { Entity } from "firecms";
import { IUser } from "../types/iuser.type";
import { UserScheduler } from "../widgets/UserScheduler";

export function UserSchedulerView({ entity, compositionId }: {
    entity: Entity<IUser> | undefined,
    compositionId: string | undefined
}) {

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
                    {entity ?
                        <UserScheduler userId={entity.id} compositionId={compositionId} /> : <CircularProgress />}
                </Box>

            </Box>
        </Box>
    );

}