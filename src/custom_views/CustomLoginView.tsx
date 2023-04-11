import { useState } from "react";
import { FirebaseLoginView, FirebaseLoginViewProps } from "firecms";
import { FormControlLabel, FormGroup, Switch, Typography } from "@mui/material";

export function CustomLoginView(props: FirebaseLoginViewProps) {

    const [termsAccepted, setTermsAccepted] = useState(false);

    return (
        <FirebaseLoginView
            {...props}
            disableSignupScreen={false}
            noUserComponent={<>
                Sample custom message when no user exists
            </>}
            disabled={!termsAccepted}
            additionalComponent={
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Switch size="small"
                                value={termsAccepted}
                                onChange={
                                    (event: React.ChangeEvent<HTMLInputElement>) => {
                                        setTermsAccepted(event.target.checked);
                                    }} />
                        }
                        label={
                            <Typography variant={"caption"}>
                                By signing in you agree to our <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={"https://firecms.co/policy/terms_conditions"}>
                                    Terms and Conditions</a> and our <a
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        href={"https://firecms.co/policy/privacy_policy"}>
                                    Privacy policy</a>
                            </Typography>
                        } />
                </FormGroup>
            }
        />
    );
}
