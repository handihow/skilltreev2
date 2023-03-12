import {
    Box, Paper,
} from "@mui/material";

import {
    EntityCollectionView,
    useAuthController,
} from "firecms";
import { buildShareRequestCollection } from "../collections/share_request_collection";
import { useParams } from "react-router";

export function ShareRequestsView() {

    const authController = useAuthController();
    const { id } = useParams();

    return (
        <Box>

            <Paper
                variant={"outlined"}
                sx={{
                    // width: 800,
                    height: 400,
                    overflow: "hidden",
                    my: 2
                }}>
                {authController.user && <EntityCollectionView {...buildShareRequestCollection("admin", authController.user, id)}
                    fullPath={"share_requests"} />}
            </Paper>
        </Box>
    );
}
