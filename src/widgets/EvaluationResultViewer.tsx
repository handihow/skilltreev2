import { Chip, Typography } from "@mui/material";
import { CHIP_COLORS } from "../common/StandardData";
import { IEvaluationModel } from "../types/ievaluation.model.type";
import { IEvaluation } from "../types/ievaluation.type";
import { InfoChip } from "../types/infoChip.type";

export function EvaluationResultViewer({
    evaluation,
    evaluationModel,
    viewAsChip
}: {
    evaluation: IEvaluation | undefined,
    evaluationModel: IEvaluationModel | null,
    viewAsChip: boolean
}) {

    let gradeChip: InfoChip = {
        label: "",
        color: undefined,
        bgColor: undefined
    }
    if (evaluation?.repeat) {
        gradeChip.label = "Repeat";
        gradeChip.bgColor = CHIP_COLORS["grayLighter"].color;
        gradeChip.color = CHIP_COLORS["grayLighter"].text;
    } else {
        switch (evaluationModel?.type) {
            case "percentage":
                if (evaluationModel?.passLevel && evaluation?.percentage && evaluationModel.passLevel > evaluation.percentage) {
                    gradeChip.bgColor = CHIP_COLORS["redLight"].color;
                    gradeChip.color = CHIP_COLORS["redLight"].text;
                } else {
                    gradeChip.bgColor = CHIP_COLORS["greenDark"].color;
                    gradeChip.color = CHIP_COLORS["greenDark"].text;
                };
                gradeChip.label += evaluation?.percentage?.toString() + " %";
                break;
            case "numerical":
                if (evaluationModel?.passLevel && evaluation?.grade && evaluationModel.passLevel >= evaluation.grade) {
                    gradeChip.bgColor = CHIP_COLORS["redLight"].color;
                    gradeChip.color = CHIP_COLORS["redLight"].text;
                } else {
                    gradeChip.bgColor = CHIP_COLORS["greenDark"].color;
                    gradeChip.color = CHIP_COLORS["greenDark"].text;
                };
                gradeChip.label += evaluation?.grade?.toString() || "";
                break;
            case "letter":
                const option = evaluationModel?.options?.find(o => o.letter === evaluation?.letter);
                if (option) {
                    gradeChip.bgColor = CHIP_COLORS[option.color].color;
                    gradeChip.color = CHIP_COLORS[option.color].text;
                    if (viewAsChip) gradeChip.label = option.description;
                    if (!viewAsChip) gradeChip.label = option.letter;
                }
                break;
            default:
                break;
        }
    }

    return (
        gradeChip.label ? 
        viewAsChip ?
        <Chip label={gradeChip.label} variant="filled" size="small" sx={{ backgroundColor: gradeChip.bgColor, color: gradeChip.color, marginBottom: 3 }} /> :
        <Typography component="span" variant="caption" sx={{ backgroundColor: gradeChip.bgColor, color: gradeChip.color, borderRadius: "25px", padding: "3px 15px" }}>{gradeChip.label}</Typography> : <span></span>
    );
}