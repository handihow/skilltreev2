import { PropertyPreviewProps } from "firecms";

export default function CustomHTMLPreview({
    value
}: PropertyPreviewProps<string>) {
    return (
        value ? <div dangerouslySetInnerHTML={{__html: value}}></div> : null
    );
}