
export type IOrganization = {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    contacts?: any[];
    createdAt: Date;
    updatedAt: Date;
}