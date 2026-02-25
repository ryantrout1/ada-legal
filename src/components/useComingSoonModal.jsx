import React, { createContext, useContext, useState, useCallback } from 'react';
import ComingSoonModal from './ComingSoonModal';

const ComingSoonContext = createContext(null);

export function useComingSoon() {
  return useContext(ComingSoonContext);
}

export function ComingSoonProvider({ children }) {
  const [modalState, setModalState] = useState({ open: false, signupType: 'report_violation' });

  const openModal = useCallback((signupType = 'report_violation') => {
    setModalState({ open: true, signupType });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <ComingSoonContext.Provider value={{ openModal }}>
      {children}
      <ComingSoonModal
        isOpen={modalState.open}
        onClose={closeModal}
        signupType={modalState.signupType}
      />
    </ComingSoonContext.Provider>
  );
}