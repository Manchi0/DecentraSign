// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';

interface PDFViewerProps {
  src: string;
  alt?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ src, alt = 'PDF Document' }) => {
  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}>
      <iframe src={src} width="100%" height="100%" title={alt} style={{ border: 'none' }} />
    </div>
  );
};

export default PDFViewer;
