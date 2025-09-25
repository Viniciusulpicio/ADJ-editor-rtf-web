declare module "*ckeditor5.js" {
  const ClassicEditor: any;
  export default ClassicEditor;
}

// Esta declaração é para o componente React do CKEditor.
declare module '@ckeditor/ckeditor5-react' {
  import * as React from 'react';
  const CKEditor: React.FunctionComponent<{
      editor: any;
      data?: string;
      config?: any;
      onReady?: (editor: any) => void;
      onChange?: (event: any, editor: any) => void;
      onBlur?: (event: any, editor: any) => void;
      onFocus?: (event: any, editor: any) => void;
      onError?: (event: any, editor: any) => void;
      disabled?: boolean;
  }>
  export { CKEditor };
}

declare module '@ckeditor/ckeditor5-build-classic' {
  const ClassicEditor: any;
  export default ClassicEditor;
}
