// import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, CircularProgress, Typography } from "@mui/material";
import { useSnackbarController } from "firecms";
import { SyntheticEvent, useEffect, useState } from "react";
import { getUserResults } from "../services/user.service";
import { IResult } from "../types/iresult.type";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IComposition } from "../types/icomposition.type";
import { getComposition, getCompositionSkillCount, getCompositionSkilltrees } from "../services/composition.service";
import { ISkill } from "../types/iskill.type";
import { IEvaluation } from "../types/ievaluation.type";
import { getCompositionEvaluations, getEvaluationModel } from "../services/evaluation.service";
import { ISkilltree } from "../types/iskilltree.type";
import { TreeView, TreeItem } from "@mui/lab";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { calculateAverageGrade, isGradedSkill, skillArrayToSkillTree } from "../common/StandardFunctions";
import { IEvaluationModel } from "../types/ievaluation.model.type";
import { CircularProgressWithLabel } from "./ProgressWithLabel";
import { EvaluationResultViewer } from "./EvaluationResultViewer";

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

    const snackbarController = useSnackbarController();
    const [isLoading, setIsLoading] = useState(true);

    const [composition, setComposition] = useState<IComposition | null>(null);
    const [skillCount, setSkillCount] = useState<number>(0);
    const [skills, setSkills] = useState<ISkill[]>([]);
    const [evaluationModel, setEvaluationModel] = useState<IEvaluationModel | null>(null);
    const [evaluations, setEvaluations] = useState<IEvaluation[]>([]);
    const [completedCount, setCompletedCount] = useState<number>(0);

    const handleError = (error: string, setLoading = true) => {
        snackbarController.open({
            type: "error",
            message: "Could not retrieve your results: " + error
        })
        if (setLoading) setIsLoading(false)
    }

    const initialize = async () => {
        const [composition, error] = await getComposition(compositionId);
        if (error) handleError(error);
        if (composition) setComposition(composition);
        const [skillCount, completedCount] = await getCompositionSkillCount(compositionId, userId);
        if (skillCount) setSkillCount(skillCount);
        if (completedCount) setCompletedCount(completedCount);
        const [skills, evaluations, error2] = await getCompositionEvaluations(compositionId, userId);
        if (error2) handleError(error2);
        if (skills) setSkills(skills);
        if (evaluations) setEvaluations(evaluations);
        if (composition?.evaluationModel) {
            const [evaluationModel, error3] = await getEvaluationModel(composition.evaluationModel);
            if (error3) handleError(error3);
            if (evaluationModel) setEvaluationModel(evaluationModel);
        }
        setIsLoading(false);
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
                <Typography sx={{ width: '55%', flexShrink: 0 }}>
                    {composition?.title}
                </Typography>
                <Typography sx={{ width: '30%' }}>{evaluationModel && <EvaluationResultViewer
                    evaluation={calculateAverageGrade(evaluations, skills, evaluationModel)}
                    evaluationModel={evaluationModel}
                    viewAsChip={true} />}</Typography>

                <CircularProgressWithLabel value={Math.round(completedCount / skillCount * 100)} />
            </AccordionSummary>
            <AccordionDetails>
                {expanded === compositionId && composition && !isLoading ?
                    <CompositionResults composition={composition} skills={skills} evaluations={evaluations} evaluationModel={evaluationModel} /> : <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </div>}
            </AccordionDetails>
        </Accordion>

    )
}

function CompositionResults({
    composition,
    skills,
    evaluations,
    evaluationModel
}: {
    composition: IComposition,
    skills: ISkill[],
    evaluations: IEvaluation[],
    evaluationModel: IEvaluationModel | null
}) {
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

    const [transformedSkills, setTransformedSkills] = useState<ISkill[]>([]);
    const [skilltrees, setSkilltrees] = useState<ISkilltree[]>([]);

    const initialize = async () => {

        const [skilltrees, error2] = await getCompositionSkilltrees(composition.id || "");

        if (error2) return handleError(error2);

        const transformedSkills = skillArrayToSkillTree(
            skills
        );
        if (transformedSkills) setTransformedSkills(transformedSkills);
        if (skilltrees) setSkilltrees(skilltrees);
        setIsLoading(false);
    }

    useEffect(() => {
        initialize();
    }, []);

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
                        <TreeItem nodeId={skilltree.id || ''} label={
                            <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, pr: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
                                    {skilltree.title}
                                </Typography>
                                <Typography variant="caption" color="inherit">
                                    {evaluationModel &&
                                        <EvaluationResultViewer
                                            evaluation={calculateAverageGrade(evaluations.filter(e => e.skilltree.id === skilltree.id), skills, evaluationModel)}
                                            evaluationModel={evaluationModel}
                                            viewAsChip={false} />}
                                </Typography>
                            </Box>
                        } key={skilltree.id || ""}>
                            {transformedSkills.filter(s => s.skilltree === skilltree.id).map(skill =>
                                <RecursiveTreeItem key={skill.id} skill={skill} composition={composition} evaluations={evaluations} evaluationModel={evaluationModel} />)}
                        </TreeItem>
                    ))}
                </TreeView>
            </Box>
    )
}


function RecursiveTreeItem({
    composition,
    skill,
    evaluations,

    evaluationModel
}: {
    composition: IComposition,
    skill: ISkill,
    evaluations: IEvaluation[],
    evaluationModel: IEvaluationModel | null
}) {

    const evaluation = evaluations.find(e => e.skill.id === skill.id);

    return (
        <TreeItem nodeId={skill.id || ""} label={
            <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, pr: 0 }}>
                <Typography variant="body2" color={isGradedSkill(composition, skill) ? "CaptionText" : "InactiveCaptionText"} sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
                    {skill.title}
                </Typography>
                <Typography variant="caption" color="inherit">
                    {isGradedSkill(composition, skill) && evaluation && <EvaluationResultViewer evaluation={evaluation} evaluationModel={evaluationModel} viewAsChip={false} />}
                    {isGradedSkill(composition, skill) && !evaluation && "-"}
                </Typography>
            </Box>
        }>
            {Array.isArray(skill.children)
                ? skill.children.map((node: ISkill) =>
                    <RecursiveTreeItem key={node.id} skill={node} composition={composition} evaluations={evaluations} evaluationModel={evaluationModel} />)
                : null}
        </TreeItem>
    );
};