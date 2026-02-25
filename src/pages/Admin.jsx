import React, { useEffect } from 'react';
import { createPageUrl } from '../utils';

export default function Admin() {
  useEffect(() => {
    window.location.href = createPageUrl('AdminCases');
  }, []);

  return null;
}