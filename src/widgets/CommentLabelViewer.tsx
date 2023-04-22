import { Chip, Typography } from "@mui/material";
import { CHIP_COLORS, commentLabels } from "../common/StandardData";
import { InfoChip } from "../types/infoChip.type";

export function CommentLabelViewer({
  viewAsChip,
  label
}: {
  label: "ineedhelp" | "question",
  viewAsChip: boolean
}) {
  let labelChip: InfoChip = {
    label: commentLabels[label].label,
    color: undefined,
    bgColor: undefined
  }

  switch (label) {
    case "question":
      labelChip.bgColor = CHIP_COLORS["blueDark"].color;
      labelChip.color = CHIP_COLORS["blueDark"].text;
      break;
    case "ineedhelp":
      labelChip.bgColor = CHIP_COLORS["pinkLight"].color;
      labelChip.color = CHIP_COLORS["pinkLight"].text;
      break;
    default:
      break;
  }

  return (
    labelChip.label ?
      viewAsChip ?
        <Chip label={labelChip.label} variant="filled" size="small" sx={{ backgroundColor: labelChip.bgColor, color: labelChip.color }} /> :
        <Typography component="span" variant="caption" sx={{ backgroundColor: labelChip.bgColor, color: labelChip.color, borderRadius: "25px", padding: "3px 15px" }}>{labelChip.label}</Typography> : <span></span>
  )
}