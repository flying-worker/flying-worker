declare const Str: {
    snake: (str: string, delimiter?: string) => string;
    contains: (haystack: string, needles: string | string[], ignoreCase?: boolean) => boolean;
    uuid: () => string;
    slug: (title: string, separator?: string) => string;
};

export { Str };
