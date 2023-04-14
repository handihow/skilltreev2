import { GitHub } from "@mui/icons-material"
import { Tooltip, IconButton, Button, Menu, MenuItem } from "@mui/material"
import { useState } from "react";
import SupportIcon from '@mui/icons-material/Support';

export function ToolbarExtraWidget() {

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div>
            <Tooltip
                title="Support">
                <IconButton
                    id="basic-button"
                    aria-controls={open ? 'basic-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleClick}
                    size="large">
                    <SupportIcon />
                </IconButton>
            </Tooltip>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem
                    href={"https://github.com/handihow/skilltreev2/wiki"}
                    rel="noopener noreferrer"
                    target="_blank"
                    component={"a"}
                >Wiki Pages</MenuItem>
                <MenuItem
                    href={"https://github.com/handihow/skilltreev2/issues"}
                    rel="noopener noreferrer"
                    target="_blank"
                    component={"a"}
                >Raise Issue</MenuItem>
                <MenuItem
                    href={"https://github.com/handihow/skilltreev2"}
                    rel="noopener noreferrer"
                    target="_blank"
                    component={"a"}
                >Project on GitHub</MenuItem>
            </Menu>
        </div>
    );

}