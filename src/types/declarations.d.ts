declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.webp' {
  const value: any;
  export default value;
}
