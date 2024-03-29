import React, { useContext } from 'react';
import { useNavigate } from "react-router";
import LinkIcon from '@mui/icons-material/Link';
import CommentIcon from '@mui/icons-material/Comment';
import { Button, ButtonGroup, Chip, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack } from '@mui/material';
import AlertDialog from './AlertDialog';
import { ViewerContext } from '../context/ViewerContext';
import { SkillsContext } from '../context/SkillsContext';
import { useAuthController, useSideEntityController, useSnackbarController } from 'firecms';
import { buildEvaluationsCollection } from '../collections/evaluation_collection';
import { skillsCollection } from '../collections/skill_collection';
import { deleteFromPathRecursively } from '../services/firestore';
import { CHIP_COLORS } from '../common/StandardData';
import { buildEventsCollection } from '../collections/event_collection';
import { convertToDateTimeString, formatTimeAgo, isGradedSkill } from '../common/StandardFunctions';
import { EvaluationResultViewer } from './EvaluationResultViewer';

export default function SkillContent(props: {
    id: string;
    optional: any;
    description: any;
    links: any[];
}) {

    // hook to display custom snackbars
    const snackbarController = useSnackbarController();
    const sideEntityController = useSideEntityController();
    const authController = useAuthController();

    const navigate = useNavigate();
    const navigateToComments = () => {
        navigate("/skills/" + props.id + "/comments");
    }

    const handleError = (error: string) => {
        snackbarController.open({
            type: "error",
            message: error
        })
    }

    const content = useContext(ViewerContext);
    const skillsContent = useContext(SkillsContext);
    const skill = skillsContent.skills.find(s => s.id === props.id);
    const nodeState = skillsContent.savedData[props.id]?.nodeState;
    const canSchedule = nodeState === "unlocked" || (!content.selectedUser && content.users.length > 0);
    const canViewLinks = nodeState !== "locked";
    const event = content.events.find(e => e.skill?.id === props.id);
    const colorOfEvent = event?.color ? event.color : "blueDark";
    const eventColor = CHIP_COLORS[colorOfEvent].color;
    const eventText = CHIP_COLORS[colorOfEvent].text;
    const eventDate = event ? event.start.toDate() : new Date();
    const evaluation = content.evaluations.find(e => e.skill.id === props.id);

    // const [isGraded,evaluation, gradeChip] = processGradeChip(content.composition, skill, content.evaluations, content.evaluationModel);

    const openSkillController = (mode: "edit" | "child" | "sibling" | "grade" | "feedback" | "todo") => {
        const pathAsArray = skill?.path?.split("/");
        switch (mode) {
            case "edit":
                pathAsArray?.pop();
                sideEntityController.open({
                    entityId: skill?.id,
                    path: pathAsArray?.join("/") || "",
                    collection: skillsCollection
                });
                break;
            case "child":
                pathAsArray?.push("skills");
                sideEntityController.open({
                    entityId: undefined,
                    path: pathAsArray?.join("/") || "",
                    collection: skillsCollection
                });
                break;
            case "sibling":
                pathAsArray?.pop();
                sideEntityController.open({
                    entityId: undefined,
                    path: pathAsArray?.join("/") || "",
                    collection: skillsCollection
                });
                break;
            case "todo":
                sideEntityController.open({
                    entityId: event?.id,
                    path: "events",
                    collection: buildEventsCollection(
                        "edit",
                        authController.user?.uid,
                        content.selectedUser ? [content.selectedUser.id] : content.users.map(u => u.id),
                        content.composition?.id,
                        skill?.skilltree, skill?.id,
                        skill?.title
                    )

                });
                break;
            default:
                break;
        }
    }

    const deleteSkill = async () => {
        if (!skill?.path) return handleError("No skill path available");
        const error = await deleteFromPathRecursively(skill.path, "Skills")
        if (error) handleError(error);
    }

    const gradeSkill = async () => {
        if (!content.selectedUser || !skill?.path) return handleError("You must select a user to grade this skill.");
        if (!content.evaluationModel) return handleError("You must set an evaluation model to grade this skill. Check the SkillTree settings.");
        if (skill.gradeSkill === "not_graded") return handleError("This skill is not graded. Check the SkillTree settings.");
        if (!content.composition?.gradeAllSkillsByDefault && skill.gradeSkill !== "graded") return handleError("This skill is not graded. Check the SkillTree settings.");
        const split = skill.path.split("/");
        const compositionId = split.length ? split[1] : "";
        const skilltreeId = split.length ? split[3] : "";
        sideEntityController.open({
            entityId: evaluation?.id,
            path: "evaluations",
            collection: buildEvaluationsCollection("evaluations", content.evaluationModel, authController.user?.uid, content.selectedUser.id, compositionId, skilltreeId, skill.id),
        })
    }

    return (
        <React.Fragment>
            <Stack direction="row" spacing={1}>
                {props.optional && <Chip label="optional" variant="filled" color="primary" sx={{ marginBottom: 3 }} />}
                {isGradedSkill(content.composition, skill) && <EvaluationResultViewer evaluation={evaluation} evaluationModel={content.evaluationModel} viewAsChip={true} />}
                {canSchedule && event && <Chip label={formatTimeAgo(eventDate)} variant="filled" sx={{ backgroundColor: eventColor, color: eventText }} />}
            </Stack>
            <div
                dangerouslySetInnerHTML={{ __html: props.description }}
            />
            {canViewLinks && <List>
                {props.links.map((link) => (
                    <ListItem key={link.id} disablePadding>
                        <ListItemButton component="a" href={link.reference} target="_blank" rel="noopener noreferrer">
                            <ListItemIcon color="secondary">
                                <LinkIcon />
                            </ListItemIcon>
                            <ListItemText primary={link.title} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>}
            {content.mode === "editor" &&
                <ButtonGroup variant="contained" size="small" aria-label="contained small button group">
                    <Button aria-label="edit" onClick={() => openSkillController("edit")} color="primary">
                        Edit
                    </Button>
                    <Button aria-label="edit" onClick={() => openSkillController("child")} color="success">
                        +child
                    </Button>
                    <Button aria-label="edit" onClick={() => openSkillController("sibling")} color="success">
                        +sibling
                    </Button>
                    <AlertDialog
                        agreeFunction={deleteSkill}
                        functionParams={{}}
                        openBtnText="delete"
                        agreeBtnText="Okay, delete!"
                        alertWarning="This will delete the skill and all it's child skills! Do you really want to do this?"
                        btnColor='error'
                    ></AlertDialog>
                </ButtonGroup>
            }
            {content.mode !== "editor" &&
                <ButtonGroup variant="contained" size="small" aria-label="contained small button group">
                    {content.mode === "instructor" && isGradedSkill(content.composition, skill) && <Button aria-label="grade" onClick={gradeSkill} color="primary">
                        +grade
                    </Button>}
                    {content.mode === "instructor" && (canSchedule || isGradedSkill(content.composition, skill)) && <Button aria-label="feedback" onClick={() => openSkillController("todo")} color="success">
                        +todo
                    </Button>}
                    <Button aria-label='comment' onClick={navigateToComments} color="success">+comment</Button>
                </ButtonGroup>

            }
        </React.Fragment>
    )
}
