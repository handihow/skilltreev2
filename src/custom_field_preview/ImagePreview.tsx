import { PropertyPreviewProps } from "firecms";

export default function CustomImagePreview({
    value
}: PropertyPreviewProps<string>) {
    return (
        value ? <img src={value} width={50} height={50} alt='Icon' /> : null
    );
}