import {
    Avatar,
    Box, Button, Card, CardActions, CardContent, Container, IconButton, List, ListItem, ListItemAvatar, ListItemButton, ListItemIcon, ListItemText, Paper, Switch, Typography,
} from "@mui/material";

import {
    useAuthController,
    useModeController,
    useSnackbarController,
} from "firecms";
import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { getComposition, updateCompositionShareSettings } from "../services/composition.service";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import ApprovalIcon from '@mui/icons-material/Approval';
import ShareIcon from '@mui/icons-material/Share';
import NaturePeopleIcon from '@mui/icons-material/NaturePeople';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { IComposition } from "../types/icomposition.type";

export function ShareSkillTreeView() {
    const snackbarController = useSnackbarController();
    const authController = useAuthController();
    const modeController = useModeController();
    const { id } = useParams();
    const [composition, setComposition] = useState<IComposition | null>(null);
    const navigate = useNavigate();
    const backToOverview = () => {
        navigate("/own-skilltrees");
    }

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
        const checked: ("copy" | "authorize" | "update")[] = [];
        if (composition.canCopy) checked.push("copy");
        if (composition.requireShareApproval) checked.push("authorize");
        if (composition.loggedInUsersCanEdit) checked.push("update");
        setChecked(checked);
    }

    useEffect(() => {
        initialize();
    }, [])

    const [checked, setChecked] = useState<("copy" | "authorize" | "update")[]>([]);

    const handleToggle = (value: "copy" | "authorize" | "update") => () => {
        const currentIndex = checked.indexOf(value);
        const newChecked = [...checked];

        if (currentIndex === -1) {
            newChecked.push(value);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setChecked(newChecked);
        if (!composition?.id) return;
        updateCompositionShareSettings(composition.id, value, currentIndex === -1);
    };

    const copySkilltreeID = () => {
        navigator.clipboard.writeText(composition?.id || "");
        snackbarController.open({
            type: "success",
            message: "ID copied to clipboard"
        })
    }

    return (
        <Box m="auto"
            display="flex"
            flexDirection={"column"}
            alignItems={"center"}
            justifyItems={"center"}
        >


            <Container maxWidth={"lg"}
                sx={{
                    alignItems: "start",
                    justifyItems: "center",
                    display: "flex",
                    flexDirection: "row"

                }}>
                <Card sx={{ m: 4, maxWidth: "450px" }}>
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="div">{composition?.title}</Typography>
                        <Typography gutterBottom component="div">Take the following steps to share this SkillTree:</Typography>
                        <List component="nav" >
                            <ListItem key="1" >
                                <ListItemAvatar>
                                    <Avatar>
                                        <ContentCopyIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary="Copy ID" secondary="Step 1: copy the SkillTree ID" />
                            </ListItem>
                            <ListItem key="2">
                                <ListItemButton onClick={copySkilltreeID}>
                                    <ListItemIcon>
                                        <ContentCopyIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={composition?.id} />
                                </ListItemButton>

                            </ListItem>
                            <ListItem key="3">
                                <ListItemAvatar>
                                    <Avatar>
                                        <ShareIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary="Share ID" secondary="Step 2: share the ID how you wish: email, chat" />
                            </ListItem>
                            <ListItem key="4">
                                <ListItemAvatar>
                                    <Avatar>
                                        <NaturePeopleIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary="Add to Shared SkillTrees" secondary="Step 3: under Shared SkillTrees, users choose 'Add' and paste the SkillTree ID." />
                            </ListItem>
                            <ListItem key="5" >
                                <ListItemAvatar>
                                    <Avatar>
                                        <ApprovalIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary="Approve (automatically)" secondary="Step 4: depending on SkillTree settings, you must then authorize the share request or it is approved automatically." />

                            </ListItem>
                        </List>
                    </CardContent>
                    <CardActions>
                        <Button color={modeController.mode === "dark" ? "secondary" : "primary"} onClick={backToOverview}>Back</Button>
                    </CardActions>
                </Card>
                <Card sx={{ m: 4, maxWidth: "450px" }}>
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="div">Share settings</Typography>
                        <List component="nav">
                            <ListItem key="copy">
                                <ListItemAvatar>
                                    <Avatar>
                                        <ContentCopyIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary="Copy" secondary="Users can copy your SkillTree on Shared SkillTree page" />
                                <Switch
                                    color={modeController.mode === "dark" ? "secondary" : "primary"}
                                    edge="end"
                                    onChange={handleToggle('copy')}
                                    checked={checked.indexOf('copy') !== -1}
                                    inputProps={{
                                        'aria-labelledby': 'switch-list-label-copy',
                                    }}
                                />
                            </ListItem>
                            <ListItem key="update">
                                <ListItemAvatar>
                                    <Avatar >
                                        <DoneIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary="Completion status" secondary="Users can update the completion status" />
                                <Switch
                                    color={modeController.mode === "dark" ? "secondary" : "primary"}
                                    edge="end"
                                    onChange={handleToggle('update')}
                                    checked={checked.indexOf('update') !== -1}
                                    inputProps={{
                                        'aria-labelledby': 'switch-list-label-update',
                                    }}
                                />
                            </ListItem>
                            <ListItem key="authorize">
                                <ListItemAvatar>
                                    <Avatar>
                                        <ApprovalIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary="Authorize share requests" secondary="You must authorize share requests" />
                                <Switch
                                    color={modeController.mode === "dark" ? "secondary" : "primary"}
                                    edge="end"
                                    onChange={handleToggle('authorize')}
                                    checked={checked.indexOf('authorize') !== -1}
                                    inputProps={{
                                        'aria-labelledby': 'switch-list-label-authorize',
                                    }}
                                />
                            </ListItem>
                            {/* <ListItem key="tips" secondaryAction={
                                <IconButton edge="end" aria-label="delete">
                                    <OpenInNewIcon />
                                </IconButton>
                            }>
                                <ListItemAvatar>
                                    <Avatar>
                                        <TipsAndUpdatesIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary="PRO tip" secondary="In the SkillTree PRO application you can assign SkillTrees to groups of students" />
                            </ListItem> */}
                        </List>
                    </CardContent>

                </Card>
            </Container>
        </Box>
    );
}
