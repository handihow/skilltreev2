import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { useState } from "react";


export function AlertDialog({
  agreeFunction,
  functionParams,
  openBtnText,
  agreeBtnText,
  alertWarning
}: {
  agreeFunction: Function,
  functionParams: any,
  openBtnText: string,
  agreeBtnText: string,
  alertWarning: string
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
    <div>
      {/* Button to trigger the opening of the dialog */}
      <Button onClick={handleClickOpen}>{openBtnText}</Button>
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
          <Button onClick={handleAgree} color="warning" autoFocus>
            {agreeBtnText}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );

}

export default AlertDialog;
