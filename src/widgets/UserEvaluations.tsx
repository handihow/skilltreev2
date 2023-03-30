// import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, CircularProgress, Typography } from "@mui/material";
import { useAuthController, useSnackbarController } from "firecms";
import { SyntheticEvent, useEffect, useState } from "react";
import { getUserResults } from "../services/user.service";
import { IResult } from "../types/iresult.type";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IComposition } from "../types/icomposition.type";
import { getComposition, getCompositionSkillCount, getCompositionSkilltrees } from "../services/composition.service";
import { ISkill } from "../types/iskill.type";
import { IEvaluation } from "../types/ievaluation.type";
import { getCompositionEvaluations } from "../services/evaluation.service";
import { ISkilltree } from "../types/iskilltree.type";
import { TreeView, TreeItem } from "@mui/lab";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { skillArrayToSkillTree } from "../common/StandardFunctions";

export function UserEvaluations({ userId, compositionId }: {
    userId: string,
    compositionId: string | undefined
}) {

    const snackbarController = useSnackbarController();
    const [isLoading, setIsLoading] = useState(true);
    const [result, setResult] = useState<IResult | null>(null);
    const [expanded, setExpanded] = useState<string | false>(false);

    const handleChange =
        (panel: string) => (event: SyntheticEvent, isExpanded: boolean) => {
            setExpanded(isExpanded ? panel : false);
        };

    const handleError = (error: string, setLoading = true) => {
        snackbarController.open({
            type: "error",
            message: "Could not retrieve your results: " + error
        })
        if (setLoading) setIsLoading(false)
    }

    const initialize = async () => {
        const [result, error] = await getUserResults(userId);
        if (error) handleError(error);
        setResult(result);
        setIsLoading(false);
        if (compositionId) handleChange(compositionId);
    }

    useEffect(() => {
        initialize();
    }, []);

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
                    {isLoading ? <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </div> :
                        <div>
                            {result?.compositions.map(composition =>
                                <CompositionDetails
                                    compositionId={composition}
                                    userId={userId}
                                    expanded={expanded}
                                    handleChange={handleChange}
                                    key={composition} />
                            )}
                        </div>
                    }
                </Box>
            </Box>
        </Box>
    );

}

function CompositionDetails({ compositionId, userId, expanded, handleChange }: { compositionId: string, userId: string, expanded: string | false, handleChange: Function }) {

    const [composition, setComposition] = useState<IComposition | null>(null);
    const [skillCount, setSkillCount] = useState<number>(0);
    const [completedCount, setCompletedCount] = useState<number>(0);

    const initialize = async () => {
        const [composition, _error] = await getComposition(compositionId);
        if (composition) setComposition(composition);
        const [skillCount, completedCount] = await getCompositionSkillCount(compositionId, userId);
        if (skillCount) setSkillCount(skillCount);
        if (completedCount) setCompletedCount(completedCount);
    }

    useEffect(() => {
        initialize();
    }, []);

    return (
        <Accordion expanded={expanded === compositionId} onChange={handleChange(compositionId)} key={compositionId}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1bh-content"
                id={"panel1bh-header-" + compositionId}
            >
                <Typography sx={{ width: '50%', flexShrink: 0 }}>
                    {composition?.title}
                </Typography>
                <Typography sx={{ color: 'text.secondary' }}>Completed {completedCount} / {skillCount}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                {expanded === compositionId && composition ? <CompositionResults composition={composition} userId={userId} /> : <Typography>
                    Loading...
                </Typography>}
            </AccordionDetails>
        </Accordion>

    )
}

function CompositionResults({ composition, userId }: { composition: IComposition, userId: string }) {
    const snackbarController = useSnackbarController();
    const [isLoading, setIsLoading] = useState(true);
    const [expanded, setExpanded] = useState<string[]>([]);

    const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
        setExpanded(nodeIds);
    };

    const handleError = (error: string, setLoading = true) => {
        snackbarController.open({
            type: "error",
            message: "Could not retrieve your results: " + error
        })
        if (setLoading) setIsLoading(false)
    }

    const handleExpandClick = () => {
        setExpanded((oldExpanded) =>
            oldExpanded.length === 0 ? skilltrees.map(st => st.id || "").concat(skills.map(s => s.id || "")) : [],
        );
    };

    const [skills, setSkills] = useState<ISkill[]>([]);
    const [transformedSkills, setTransformedSkills] = useState<ISkill[]>([]);
    const [evaluations, setEvaluations] = useState<IEvaluation[]>([]);
    const [skilltrees, setSkilltrees] = useState<ISkilltree[]>([]);

    const initialize = async () => {
        const [skills, evaluations, error] = await getCompositionEvaluations(composition.id || "", userId);
        const [skilltrees, error2] = await getCompositionSkilltrees(composition.id || "");
        if (error) return handleError(error);
        if (error2) return handleError(error2);
        if (skills) setSkills(skills);
        const transformedSkills = skillArrayToSkillTree(
            skills
        );
        if (transformedSkills) setTransformedSkills(transformedSkills);
        if (evaluations) setEvaluations(evaluations);
        if (skilltrees) setSkilltrees(skilltrees);
        setIsLoading(false);
    }

    useEffect(() => {
        initialize();
    }, []);

    const renderTree = (nodes: ISkill) => (
        <TreeItem key={nodes.id} nodeId={nodes.id || ""} label={nodes.title}>
            {Array.isArray(nodes.children)
                ? nodes.children.map((node: any) => renderTree(node))
                : null}
        </TreeItem>
    );

    return (
        isLoading ? <div style={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
        </div> :
            <Box sx={{ height: 270, flexGrow: 1, maxWidth: 400, overflowY: 'auto' }} key={composition.id}>
                <Box sx={{ mb: 1 }}>
                    <Button onClick={handleExpandClick}>
                        {expanded.length === 0 ? 'Expand all' : 'Collapse all'}
                    </Button>
                </Box>
                <TreeView
                    aria-label="file system navigator"
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpandIcon={<ChevronRightIcon />}
                    expanded={expanded}
                    onNodeToggle={handleToggle}
                >
                    {skilltrees.map(skilltree => (
                        <TreeItem nodeId={skilltree.id || ''} label={skilltree.title} >
                            {transformedSkills.filter(s => s.skilltree === skilltree.id).map(s => renderTree(s))}
                        </TreeItem>
                    ))}
                </TreeView>
            </Box>
    )
}
