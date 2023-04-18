declare module '*.svg' {
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.yml' {
  const data: any;
  export default data;
}

declare module '*.scss' {
  const content: any;
  export default content;
}
