import { Typography } from "@mui/material";
import { FieldProps, FieldDescription } from "firecms";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import DescriptionIcon from '@mui/icons-material/Description';

export const RichTextEditorField = ({ property, value, setValue, customProps, touched, error, isSubmitting, context, ...props }: FieldProps<string>) => {

    return (
        <div>
            <Typography variant="label" color="textSecondary">
                <DescriptionIcon sx={{ fontSize: 12, marginLeft: "7px", marginRight: "10px" }} />
                {property.name}{property.validation?.required ? "*" : ""}
            </Typography>
            <CKEditor
                config={{
                    toolbar: ['heading', '|', 'bulletedList', 'numberedList', 'blockQuote'],
                }}
                editor={ClassicEditor}
                data={value ?? ""}
                onChange={(event: any, editor: any) => {
                    const data = editor.getData()
                    setValue(data)
                    //console.log(data)
                }}
            />
            <FieldDescription property={property} />
        </div>
    );
}