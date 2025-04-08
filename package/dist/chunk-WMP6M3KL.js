// src/supports/Str.ts
var Str = {
  snake: (str, delimiter = "_") => {
    return str.toLowerCase().replace(/\s+/g, delimiter);
  },
  contains: (haystack, needles, ignoreCase = false) => {
    let finalNeedles = Array.isArray(needles) ? needles : [needles];
    let finalHaystack = haystack;
    if (ignoreCase) {
      finalHaystack = haystack.toLowerCase();
      finalNeedles = finalNeedles.map((needle) => needle.toLowerCase());
    }
    return finalNeedles.some((needle) => finalHaystack.includes(needle));
  },
  uuid: () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
      const random = Math.random() * 16 | 0;
      const value = char === "x" ? random : random & 3 | 8;
      return value.toString(16);
    });
  },
  slug: (title, separator = "-") => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, separator).replace(new RegExp(`^${separator}|${separator}$`, "g"), "");
  }
};

export {
  Str
};
