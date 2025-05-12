export const groupBy = (key: string, array: any[]) => array?.reduce((acc, val) =>
({
    ...acc,
    [val[key]]: val[key] in acc ? acc[val[key]].concat(val) : [val],
}),
    {}
);
