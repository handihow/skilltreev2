import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton } from "@mui/material";
import React from "react";
import { useState } from "react";
import DeleteIcon from '@mui/icons-material/Delete';

export function AlertDialog({
  agreeFunction,
  functionParams,
  openBtnText,
  agreeBtnText,
  alertWarning,
  btnColor
}: {
  agreeFunction: Function,
  functionParams: any,
  openBtnText: string,
  agreeBtnText: string,
  alertWarning: string,
  btnColor: "inherit" | "primary" | "secondary" | "success" | "error" | "info" | "warning"
}) {

  const [isOpen, setIsOpen] = useState(false);

  const handleClickOpen = () => {
    setIsOpen(true)
  };

  const handleClose = () => {
    setIsOpen(false)
  };

  const handleAgree = () => {
    agreeFunction(functionParams)
    handleClose();
  };

  const handleDisagree = () => {
    console.log("I do not agree.");
    handleClose();
  };
  return (
    <React.Fragment>
      {/* Button to trigger the opening of the dialog */}
      {openBtnText === "icon" ?
        <IconButton edge="end" aria-label="delete" onClick={handleClickOpen} color={btnColor}>
          <DeleteIcon />
        </IconButton>
        :
        <Button onClick={handleClickOpen} color={btnColor}>{openBtnText}</Button>}
      {/* Dialog that is displayed if the state open is true */}
      <Dialog
        open={isOpen}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Warning"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {alertWarning}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisagree} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAgree} color="error" autoFocus>
            {agreeBtnText}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );

}

export default AlertDialog;
