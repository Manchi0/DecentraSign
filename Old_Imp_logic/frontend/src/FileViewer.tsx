// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import PDFViewer from './PDFViewer';

interface FileViewerProps {
  src: string;
  alt?: string;
  index: number;
}

export const FileViewer: React.FC<FileViewerProps> = ({ src, alt, index }) => {
  // Since you guarantee using PDFs, always use PDF viewer
  return <PDFViewer src={src} alt={alt || `Decrypted PDF ${index + 1}`} />;
};

export default FileViewer;
