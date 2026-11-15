// Member 1 – Problem reports: shake the phone anywhere to report a problem
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ReportProblemModal } from '../components/ReportProblemModal';
import { subscribeToShake } from '../services/shake';
import { useAuth } from './AuthContext';

interface ProblemReportContextValue {
  /** Open the report sheet (e.g. from the Profile screen's button). */
  openReport: () => void;
  /** The navigator tells us which screen is showing, so reports include it. */
  setCurrentScreen: (screen: string | null) => void;
}

const ProblemReportContext = createContext<ProblemReportContextValue | undefined>(undefined);

/**
 * While a user is signed in, shaking the phone opens "Report a problem" on top of
 * whatever screen is showing. Without an accelerometer nothing happens; the
 * Profile button still works.
 */
export const ProblemReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reportScreen, setReportScreen] = useState<string | null>(null);
  const currentScreen = useRef<string | null>(null);

  const openReport = useCallback(() => {
    setReportScreen(currentScreen.current);
    setIsOpen(true);
  }, []);

  const setCurrentScreen = useCallback((screen: string | null) => {
    currentScreen.current = screen;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsOpen(false);
      return undefined;
    }
    return subscribeToShake(openReport);
  }, [isAuthenticated, openReport]);

  const value = useMemo(() => ({ openReport, setCurrentScreen }), [openReport, setCurrentScreen]);

  return (
    <ProblemReportContext.Provider value={value}>
      {children}
      <ReportProblemModal visible={isOpen} screen={reportScreen} onClose={() => setIsOpen(false)} />
    </ProblemReportContext.Provider>
  );
};

export const useProblemReport = (): ProblemReportContextValue => {
  const context = useContext(ProblemReportContext);
  if (!context) {
    throw new Error('useProblemReport must be used inside <ProblemReportProvider>');
  }
  return context;
};
