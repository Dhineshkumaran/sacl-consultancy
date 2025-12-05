// Helpful declaration for @mui/icons-material subpath imports
// This allows imports like `import UploadFileIcon from '@mui/icons-material/UploadFile'`
// without TypeScript complaining when types are not present for the specific ESM file.

declare module '@mui/icons-material/*' {
  import * as React from 'react';
  const Icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { fontSize?: 'inherit' | 'small' | 'medium' | 'large' } & { [key: string]: any }>;
  export default Icon;
}
