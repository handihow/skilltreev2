import {
    Box, Container, List, ListItem, Paper, Typography,
} from "@mui/material";

import {
    useAuthController,
    useSnackbarController,
} from "firecms";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { IComposition } from "../collections/composition_collection";
import { getComposition } from "../services/composition.service";

export function ShareSkillTreeView() {
    const snackbarController = useSnackbarController();
    const authController = useAuthController();
    const { id } = useParams();
    const [composition, setComposition] = useState<IComposition | null>(null);


    const handleError = (error: string) => {
        snackbarController.open({
            type: "error",
            message: error
        })
    }

    const initialize = async () => {
        if (!authController.user || !id) return;
        const [composition, error] = await getComposition(id);
        if (error) return handleError(error);
        if (!composition) return handleError("Could not find the composition");
        setComposition(composition);
    }

    useEffect(() => {
        initialize();
    }, [])

    return (
        <Box
            width={"100%"}
            height={"100%"}>

            <Box m="auto"
                display="flex"
                flexDirection={"column"}
                alignItems={"center"}
                justifyItems={"center"}
            >


                <Container maxWidth={"lg"}
                    sx={{
                        my: 4,
                    }}>
                        <Typography gutterBottom variant="h5" component="div">{composition?.title}</Typography>
                        <Typography gutterBottom component="div">Take the following steps to share this SkillTree:</Typography>
                        <List component="nav">
                            <ListItem key="composition-edit">
                                One
                            </ListItem>
                            <ListItem key="composition-edit">
                                Two
                            </ListItem>
                            <ListItem key="composition-edit">
                                Three
                            </ListItem>
                        </List>
                </Container>
            </Box>
        </Box>
    );
}
