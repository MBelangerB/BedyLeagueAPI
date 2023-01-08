/**
 * Miscellaneous shared functions go here.
 */

/**
 * Replace a value in a string
 * @param baseString initial string
 * @param search char to replaced
 * @param replaceWith new value
 * @returns
 */
export function replaceAll(baseString: string, search: string, replaceWith: string) {
  const searchRegExp = new RegExp(search, 'gi'); // Throws SyntaxError
  return baseString.replace(searchRegExp, replaceWith);
}


/**
 * Wait for a certain number of milliseconds.
 */
export function tick(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function getBoolean(value: any) {
  switch (value) {
       case true:
       case 'true':
       case 1:
       case '1':
           return true;
       default:
           return false;
   }
}
