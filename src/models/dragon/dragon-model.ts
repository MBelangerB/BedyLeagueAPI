import { replaceAll } from '../../declarations/functions';

// *** Interface ***
export interface IDragonData {
    currentVersion: string | null,
    previousVersion?: string,
    // errorMsg: string | null,
    // message?: Array<string>,
}

export interface IChampionData {
    id: string,
    key: string,
    name: string,
    title: string,
}

// *** Function ***
function castToNumber(version: string) : number {
    const replaceValue = replaceAll(version, '[_.]', '');
    return parseInt(replaceValue);
}


// **** Export default **** //

export default {
    castToNumber,
  } as const;
