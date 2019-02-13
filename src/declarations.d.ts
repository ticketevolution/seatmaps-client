declare module "react-toggled/preact" {
    export { default } from "react-toggled"
}

declare module "svg-pan-zoom/src/svg-pan-zoom.js"

declare module "*.svg" {
    const content: any;
    export default content;
}
