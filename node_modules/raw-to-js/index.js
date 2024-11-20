export const convertRawToJS = (input) => {
    return eval("(" + input + ")");
}