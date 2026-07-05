import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchWallet, postTransaction } from '../api/client';
import { useAuth } from './AuthContext';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  reference: string;
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  addMoney: (amount: number) => void;
  deductMoney: (amount: number, gameName: string) => boolean;
  withdrawMoney: (amount: number, upiId: string) => boolean;
  transferMoney: (amount: number, username: string) => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const loadWallet = async () => {
      if (!user) {
        setBalance(0);
        setTransactions([]);
        return;
      }
      try {
        const data = await fetchWallet();
        setBalance(data.balance);
        setTransactions(data.transactions);
      } catch (err) {
        console.error(err);
      }
    };
    loadWallet();
  }, [user]);

  const addMoney = async (amount: number) => {
    // Optimistic update
    setBalance(prev => prev + amount);
    try {
      const res = await postTransaction('deposit', amount, 'Self Deposit');
      setTransactions(res.transaction ? [res.transaction, ...transactions] : transactions);
    } catch (err) {
      console.error(err);
    }
  };

  const deductMoney = (amount: number, gameName: string) => {
    if (balance >= amount) {
      setBalance(prev => prev - amount);
      postTransaction('game_fee', amount, `Entry: ${gameName}`).then(res => {
        setTransactions(prev => [res.transaction, ...prev]);
      }).catch(console.error);
      return true;
    }
    return false;
  };

  const withdrawMoney = (amount: number, upiId: string) => {
    if (balance >= amount) {
      setBalance(prev => prev - amount);
      postTransaction('withdraw', amount, `To: ${upiId}`).then(res => {
        setTransactions(prev => [res.transaction, ...prev]);
      }).catch(console.error);
      return true;
    }
    return false;
  };

  const transferMoney = (amount: number, username: string) => {
    if (balance >= amount) {
      setBalance(prev => prev - amount);
      postTransaction('transfer', amount, `To: ${username}`).then(res => {
        setTransactions(prev => [res.transaction, ...prev]);
      }).catch(console.error);
      return true;
    }
    return false;
  };

  return (
    <WalletContext.Provider value={{ balance, transactions, addMoney, deductMoney, withdrawMoney, transferMoney }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
