import axios from "axios";
import { googleFontAPIKey } from "../firebase_config";
import WebFont from 'webfontloader';

let fonts : any = {
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif": "Default" 
}

const setLoadedFonts = (families: string[]) => {
    families.forEach(family => {
        fonts[family] = family;
    })
}

export const getLoadedFonts = () => {
    return fonts;
}

export const loadFonts = async () => {
    const response = await axios
        .get(
            `https://www.googleapis.com/webfonts/v1/webfonts?key=${googleFontAPIKey}&sort=popularity`
        )
    if (response.status === 200) {
        const families = response.data.items.slice(0, 50).map((f: any) => f.family);
        WebFont.load({
            google: {
                families
            }
        });
        setLoadedFonts(families);
    }
}