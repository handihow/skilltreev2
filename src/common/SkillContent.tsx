import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, ButtonGroup, Chip } from '@mui/material';
import { useSideEntityController } from 'firecms';
import AlertDialog from '../custom_views/widgets/AlertDialog';

export default function SkillContent(props: {
    id: string;
    optional: any;
    description: any;
    links: any[];
    onEditorPage: boolean;
    openSkillControllerFunc: Function;
    deleteSkillFunc: Function;
}) {

    return (
        <React.Fragment>
            {props.optional && <Chip label="optional" variant="filled" color="primary" sx={{ marginBottom: 3 }} />}
            <div
                dangerouslySetInnerHTML={{ __html: props.description }}
            />
            <ul style={{ listStyleType: 'none', marginTop: '10px' }}>
                {props.links.map((link) => (
                    <li key={link.id}>
                        <a href={link.reference} target="_blank" rel="noopener noreferrer">
                            <span style={{ marginRight: '10px' }}>
                                <FontAwesomeIcon icon={[link.iconPrefix, link.iconName]} />
                            </span>
                            {link.title}
                        </a>
                    </li>
                ))}
            </ul>
            {props.onEditorPage &&
                <ButtonGroup variant="contained" size="small" aria-label="contained small button group">
                    <Button aria-label="edit" onClick={() => props.openSkillControllerFunc(props.id, "edit")} color="primary">
                        Edit
                    </Button>
                    <Button aria-label="edit" onClick={() => props.openSkillControllerFunc(props.id, "child")} color="success">
                        +child
                    </Button>
                    <Button aria-label="edit" onClick={() => props.openSkillControllerFunc(props.id, "sibling")} color="success">
                        +sibling
                    </Button>
                    {/* <Button aria-label="edit" onClick={() => props.deleteSkillFunc(props.id)} color="error">
                        delete
                    </Button> */}
                    <AlertDialog 
                        agreeFunction={props.deleteSkillFunc} 
                        functionParams={{id: props.id}}
                        openBtnText="delete"
                        agreeBtnText="Okay, delete!"
                        alertWarning="This will delete the skill and all it's child skills! Do you really want to do this?"
                        btnColor='error'
                    ></AlertDialog>
                </ButtonGroup>
               
            }
        </React.Fragment>
    )
}
