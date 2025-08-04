import React, { createContext, useContext, useState, useEffect } from 'react';

interface TradingModeContextType {
  isCompetitionMode: boolean;
  competitionId: number | null;
  competitionName: string | null;
  setCompetitionMode: (competitionId: number, competitionName: string) => void;
  setPersonalMode: () => void;
  toggleMode: () => void;
}

const TradingModeContext = createContext<TradingModeContextType | undefined>(undefined);

export const TradingModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCompetitionMode, setIsCompetitionMode] = useState(false);
  const [competitionId, setCompetitionId] = useState<number | null>(null);
  const [competitionName, setCompetitionName] = useState<string | null>(null);

  const setCompetitionMode = (id: number, name: string) => {
    setIsCompetitionMode(true);
    setCompetitionId(id);
    setCompetitionName(name);
    localStorage.setItem('tradingMode', 'competition');
    localStorage.setItem('competitionId', id.toString());
    localStorage.setItem('competitionName', name);
  };

  const setPersonalMode = () => {
    setIsCompetitionMode(false);
    setCompetitionId(null);
    setCompetitionName(null);
    localStorage.setItem('tradingMode', 'personal');
    localStorage.removeItem('competitionId');
    localStorage.removeItem('competitionName');
  };

  const toggleMode = () => {
    if (isCompetitionMode) {
      setPersonalMode();
    } else {
      // Can't toggle to competition mode without selecting a competition
      // This would need to redirect to competition selection
    }
  };

  // Load saved mode on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('tradingMode');
    const savedCompetitionId = localStorage.getItem('competitionId');
    const savedCompetitionName = localStorage.getItem('competitionName');
    
    if (savedMode === 'competition' && savedCompetitionId && savedCompetitionName) {
      setCompetitionMode(parseInt(savedCompetitionId), savedCompetitionName);
    } else {
      setPersonalMode();
    }
  }, []);

  return (
    <TradingModeContext.Provider value={{
      isCompetitionMode,
      competitionId,
      competitionName,
      setCompetitionMode,
      setPersonalMode,
      toggleMode,
    }}>
      {children}
    </TradingModeContext.Provider>
  );
};

export const useTradingMode = () => {
  const context = useContext(TradingModeContext);
  if (context === undefined) {
    throw new Error('useTradingMode must be used within a TradingModeProvider');
  }
  return context;
};
