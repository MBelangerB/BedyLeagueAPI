import fs, { readFileSync } from 'fs';

// https://www.geeksforgeeks.org/node-js-fs-readfilesync-method/
async function JSONFileReader(filePath: string) {
    const rawdata = readFileSync(filePath, {encoding:'utf8', flag:'r'});
    const data = JSON.parse(rawdata);
    return data;
}

function JSONFileExist(filePath: string) : boolean {
    return fs.existsSync(filePath);
}

export default {
    JSONFileReader,
    JSONFileExist,
} as const;
