import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppState, User, Service, Professional, Appointment, Role, AppointmentStatus, BusinessConfig } from '../types';
import { MOCK_SERVICES, MOCK_PROFESSIONALS, MOCK_APPOINTMENTS, MOCK_BUSINESS_CONFIG } from '../mockData';
import { initializeDB, dbServices, dbProfessionals, dbAppointments, dbConfig, dbUsers } from '../services/db';

interface AppContextType extends AppState {
  isLoading: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;
  addAppointment: (apt: Omit<Appointment, 'id' | 'status'>) => Promise<void>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  addReview: (id: string, rating: number, comment: string) => Promise<void>;
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addProfessional: (pro: Omit<Professional, 'id'>) => Promise<void>;
  updateProfessional: (id: string, pro: Partial<Professional>) => Promise<void>;
  deleteProfessional: (id: string) => Promise<void>;
  updateBusinessConfig: (config: BusinessConfig) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Data States
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>(MOCK_BUSINESS_CONFIG);

  // Load initial data from "Database"
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await initializeDB();
        const [loadedServices, loadedPros, loadedApts, loadedConfig] = await Promise.all([
          dbServices.getAll(),
          dbProfessionals.getAll(),
          dbAppointments.getAll(),
          dbConfig.get()
        ]);
        
        setServices(loadedServices);
        setProfessionals(loadedPros);
        setAppointments(loadedApts);
        setBusinessConfig(loadedConfig);
      } catch (error) {
        console.error("Failed to load data from DB", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const login = async (userId: string) => {
    if (userId === 'guest') {
        setUser({
            id: 'guest-' + Date.now(),
            name: 'Visitante',
            email: '',
            role: Role.CLIENT,
            avatarUrl: `https://ui-avatars.com/api/?name=Visitante&background=random`
        });
        return;
    }
    console.log('Attempting login for userId=', userId);
    const foundUser = await dbUsers.getById(userId);
    console.log('dbUsers.getById returned:', foundUser);
    if (foundUser) {
      setUser(foundUser);
    } else {
      console.warn('Login failed: user not found for id=', userId);
    }
  };

  const logout = () => setUser(null);

  const addAppointment = async (aptData: Omit<Appointment, 'id' | 'status'>) => {
    try {
        const newApt = await dbAppointments.create(aptData);
        setAppointments(prev => [...prev, newApt]);
    } catch (e) { console.error(e); }
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    try {
        const updated = await dbAppointments.updateStatus(id, status);
        setAppointments(prev => prev.map(apt => apt.id === id ? updated : apt));
    } catch (e) { console.error(e); }
  };

  const addReview = async (id: string, rating: number, comment: string) => {
      try {
        const updated = await dbAppointments.addReview(id, rating, comment);
        setAppointments(prev => prev.map(apt => apt.id === id ? updated : apt));
      } catch (e) { console.error(e); }
  }

  const addService = async (serviceData: Omit<Service, 'id'>) => {
      try {
        const newService = await dbServices.create(serviceData);
        setServices(prev => [...prev, newService]);
      } catch (e) { console.error(e); }
  }

  const updateService = async (id: string, serviceData: Partial<Service>) => {
    try {
        const updated = await dbServices.update(id, serviceData);
        setServices(prev => prev.map(s => s.id === id ? updated : s));
    } catch (e) { console.error(e); }
  }

  const deleteService = async (id: string) => {
      try {
        await dbServices.delete(id);
        setServices(prev => prev.filter(s => s.id !== id));
      } catch (e) { console.error(e); }
  }

  const addProfessional = async (proData: Omit<Professional, 'id'>) => {
      try {
        const newPro = await dbProfessionals.create(proData);
        setProfessionals(prev => [...prev, newPro]);
      } catch (e) { console.error(e); }
  }

  const updateProfessional = async (id: string, proData: Partial<Professional>) => {
      try {
        const updated = await dbProfessionals.update(id, proData);
        setProfessionals(prev => prev.map(p => p.id === id ? updated : p));
      } catch (e) { console.error(e); }
  }

  const deleteProfessional = async (id: string) => {
      try {
        await dbProfessionals.delete(id);
        setProfessionals(prev => prev.filter(p => p.id !== id));
      } catch (e) { console.error(e); }
  }

  const updateBusinessConfig = async (config: BusinessConfig) => {
      try {
        const updated = await dbConfig.save(config);
        setBusinessConfig(updated);
      } catch (e) { console.error(e); }
  }

  return (
    <AppContext.Provider value={{
      user, services, professionals, appointments, businessConfig, isLoading,
      login, logout, addAppointment, updateAppointmentStatus, addReview, addService, updateService, deleteService,
      addProfessional, updateProfessional, deleteProfessional, updateBusinessConfig
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};