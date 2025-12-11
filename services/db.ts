import { 
  Appointment, 
  Service, 
  Professional, 
  User, 
  BusinessConfig, 
  AppointmentStatus, 
  Role 
} from '../types';
import { 
  MOCK_SERVICES, 
  MOCK_PROFESSIONALS, 
  MOCK_USERS, 
  MOCK_APPOINTMENTS, 
  MOCK_BUSINESS_CONFIG 
} from '../mockData';
import { supabase, isSupabaseConfigured } from './supabase';

// Chaves de armazenamento
const KEYS = {
  SERVICES: 'bb_services',
  PROFESSIONALS: 'bb_professionals',
  USERS: 'bb_users',
  APPOINTMENTS: 'bb_appointments',
  CONFIG: 'bb_config'
};

// In-memory fallback for environments where localStorage is blocked (SecurityError)
const memoryStore: Record<string, string> = {};

const safeLocalStorage = {
    getItem: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('LocalStorage access denied, using memory store', e);
            return memoryStore[key] || null;
        }
    },
    setItem: (key: string, value: string): void => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('LocalStorage access denied, using memory store', e);
            memoryStore[key] = value;
        }
    }
};

// Helper para simular delay de rede (300-600ms)
const delay = () => new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));

// --- Mapeamento entre camelCase (JS) e snake_case (DB) ---
const mapServiceToDB = (service: Service) => ({
  id: service.id,
  name: service.name,
  description: service.description,
  duration_minutes: service.durationMinutes,
  price: service.price,
  image_url: service.imageUrl,
});

const mapServiceFromDB = (data: any): Service => ({
  id: data.id,
  name: data.name,
  description: data.description,
  durationMinutes: data.duration_minutes,
  price: data.price,
  imageUrl: data.image_url,
});

const mapProfessionalToDB = (professional: Professional) => ({
  id: professional.id,
  name: professional.name,
  specialties: professional.specialties,
  avatar_url: professional.avatarUrl,
});

const mapProfessionalFromDB = (data: any): Professional => ({
  id: data.id,
  name: data.name,
  specialties: data.specialties,
  avatarUrl: data.avatar_url,
});

const mapAppointmentToDB = (appointment: Appointment) => ({
  id: appointment.id,
  user_id: appointment.userId,
  user_name: appointment.userName,
  client_phone: appointment.clientPhone,
  client_email: appointment.clientEmail,
  service_id: appointment.serviceId,
  professional_id: appointment.professionalId,
  date: appointment.date,
  time: appointment.time,
  status: appointment.status,
  rating: appointment.rating,
  review_comment: appointment.reviewComment,
});

const mapAppointmentFromDB = (data: any): Appointment => ({
  id: data.id,
  userId: data.user_id,
  userName: data.user_name,
  clientPhone: data.client_phone,
  clientEmail: data.client_email,
  serviceId: data.service_id,
  professionalId: data.professional_id,
  date: data.date,
  time: data.time,
  status: data.status,
  rating: data.rating,
  reviewComment: data.review_comment,
});

const mapUserToDB = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role || 'CLIENT',
  avatar_url: user.avatarUrl || null,
});

const mapUserFromDB = (data: any): User => ({
  id: data.id,
  name: data.name,
  email: data.email,
  role: data.role,
  avatarUrl: data.avatar_url,
});

// --- Inicialização ---
export const initializeDB = async () => {
  // Se Supabase está configurado, sincronizar dados do Supabase para localStorage como fallback
  if (isSupabaseConfigured()) {
    try {
      const [services, professionals, users, appointments, config] = await Promise.all([
        supabase.from('services').select('*').then(r => r.data || []),
        supabase.from('professionals').select('*').then(r => r.data || []),
        supabase.from('users').select('*').then(r => r.data || []),
        supabase.from('appointments').select('*').then(r => r.data || []),
        supabase.from('config').select('*').single().then(r => r.data || null)
      ]);

      if (services?.length) safeLocalStorage.setItem(KEYS.SERVICES, JSON.stringify(services.map(mapServiceFromDB)));
      if (professionals?.length) safeLocalStorage.setItem(KEYS.PROFESSIONALS, JSON.stringify(professionals.map(mapProfessionalFromDB)));
      if (users?.length) safeLocalStorage.setItem(KEYS.USERS, JSON.stringify(users));
      if (appointments?.length) safeLocalStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments.map(mapAppointmentFromDB)));
      if (config) safeLocalStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
      
      console.log('✓ Supabase data loaded successfully');
      return;
    } catch (error) {
      console.warn('Supabase connection failed, falling back to localStorage:', error);
    }
  }

  // Fallback: usar localStorage com dados mock
  if (!safeLocalStorage.getItem(KEYS.SERVICES)) {
    safeLocalStorage.setItem(KEYS.SERVICES, JSON.stringify(MOCK_SERVICES));
  }
  if (!safeLocalStorage.getItem(KEYS.PROFESSIONALS)) {
    safeLocalStorage.setItem(KEYS.PROFESSIONALS, JSON.stringify(MOCK_PROFESSIONALS));
  }
  if (!safeLocalStorage.getItem(KEYS.USERS)) {
    safeLocalStorage.setItem(KEYS.USERS, JSON.stringify(MOCK_USERS));
  }
  if (!safeLocalStorage.getItem(KEYS.APPOINTMENTS)) {
    safeLocalStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(MOCK_APPOINTMENTS));
  }
  if (!safeLocalStorage.getItem(KEYS.CONFIG)) {
    safeLocalStorage.setItem(KEYS.CONFIG, JSON.stringify(MOCK_BUSINESS_CONFIG));
  }
  await delay();
};

// --- Genéricos ---
const getCollection = <T>(key: string): T[] => {
  const data = safeLocalStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveCollection = <T>(key: string, data: T[]) => {
  safeLocalStorage.setItem(key, JSON.stringify(data));
};

// --- Serviços (Services) ---
export const dbServices = {
  getAll: async (): Promise<Service[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('services').select('*');
        if (error) throw error;
        if (data) return data.map(mapServiceFromDB);
      } catch (error) {
        console.warn('Supabase services fetch failed, using localStorage:', error);
      }
    }
    await delay();
    return getCollection<Service>(KEYS.SERVICES);
  },
  create: async (data: Omit<Service, 'id'>): Promise<Service> => {
    if (isSupabaseConfigured()) {
      try {
        const newService = { ...data, id: `s${Date.now()}` };
        const { data: newItem, error } = await supabase
          .from('services')
          .insert([mapServiceToDB(newService)])
          .select()
          .single();
        if (error) throw error;
        if (newItem) {
          const mapped = mapServiceFromDB(newItem);
          // Update localStorage
          const items = getCollection<Service>(KEYS.SERVICES);
          items.push(mapped);
          saveCollection(KEYS.SERVICES, items);
          return mapped;
        }
      } catch (error: any) {
        const code = error?.code || (error?.details && error.details.code) || null;
        console.warn('Supabase service create failed, usando localStorage:', {
          erro: error instanceof Error ? error.message : String(error),
          detalhes: error
        });
        if (code === '42501' || (error?.message && String(error.message).includes('row-level security'))) {
          console.warn('\nRow-Level Security is blocking inserts to `services`. To fix, run the following SQL in Supabase SQL Editor:\n');
          console.warn("-- Allow public inserts on services (for development)\nCREATE POLICY \"Allow public insert on services\" ON services FOR INSERT USING (true) WITH CHECK (true);\n\n-- Or disable RLS temporarily (not recommended for production)\nALTER TABLE services DISABLE ROW LEVEL SECURITY;\n");
        }
      }
    }
    await delay();
    const items = getCollection<Service>(KEYS.SERVICES);
    const newItem = { ...data, id: `s${Date.now()}` };
    items.push(newItem);
    saveCollection(KEYS.SERVICES, items);
    return newItem;
  },
  update: async (id: string, data: Partial<Service>): Promise<Service> => {
    if (isSupabaseConfigured()) {
      try {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.description) updateData.description = data.description;
        if (data.durationMinutes) updateData.duration_minutes = data.durationMinutes;
        if (data.price) updateData.price = data.price;
        if (data.imageUrl) updateData.image_url = data.imageUrl;
        
        const { data: updated, error } = await supabase
          .from('services')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        if (updated) {
          const mapped = mapServiceFromDB(updated);
          const items = getCollection<Service>(KEYS.SERVICES);
          const index = items.findIndex(i => i.id === id);
          if (index !== -1) {
            items[index] = mapped;
            saveCollection(KEYS.SERVICES, items);
          }
          return mapped;
        }
      } catch (error) {
        console.warn('Supabase service update failed, using localStorage:', error);
      }
    }
    await delay();
    const items = getCollection<Service>(KEYS.SERVICES);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error("Service not found");
    items[index] = { ...items[index], ...data };
    saveCollection(KEYS.SERVICES, items);
    return items[index];
  },
  delete: async (id: string): Promise<void> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.warn('Supabase service delete failed, using localStorage:', error);
      }
    }
    await delay();
    const items = getCollection<Service>(KEYS.SERVICES);
    saveCollection(KEYS.SERVICES, items.filter(i => i.id !== id));
  }
};

// --- Profissionais ---
export const dbProfessionals = {
  getAll: async (): Promise<Professional[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('professionals').select('*');
        if (error) throw error;
        if (data) return data.map(mapProfessionalFromDB);
      } catch (error) {
        console.warn('Supabase professionals fetch failed, using localStorage:', error);
      }
    }
    await delay();
    return getCollection<Professional>(KEYS.PROFESSIONALS);
  },
  create: async (data: Omit<Professional, 'id'>): Promise<Professional> => {
    if (isSupabaseConfigured()) {
      try {
        const newProf = { ...data, id: `p${Date.now()}` };
        const { data: newItem, error } = await supabase
          .from('professionals')
          .insert([mapProfessionalToDB(newProf)])
          .select()
          .single();
        if (error) throw error;
        if (newItem) {
          const mapped = mapProfessionalFromDB(newItem);
          const items = getCollection<Professional>(KEYS.PROFESSIONALS);
          items.push(mapped);
          saveCollection(KEYS.PROFESSIONALS, items);
          return mapped;
        }
      } catch (error) {
        console.warn('Supabase professional create failed, using localStorage:', error);
      }
    }
    await delay();
    const items = getCollection<Professional>(KEYS.PROFESSIONALS);
    const newItem = { ...data, id: `p${Date.now()}` };
    items.push(newItem);
    saveCollection(KEYS.PROFESSIONALS, items);
    return newItem;
  },
  update: async (id: string, data: Partial<Professional>): Promise<Professional> => {
    if (isSupabaseConfigured()) {
      try {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.specialties) updateData.specialties = data.specialties;
        if (data.avatarUrl) updateData.avatar_url = data.avatarUrl;
        
        const { data: updated, error } = await supabase
          .from('professionals')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        if (updated) {
          const mapped = mapProfessionalFromDB(updated);
          const items = getCollection<Professional>(KEYS.PROFESSIONALS);
          const index = items.findIndex(i => i.id === id);
          if (index !== -1) {
            items[index] = mapped;
            saveCollection(KEYS.PROFESSIONALS, items);
          }
          return mapped;
        }
      } catch (error) {
        console.warn('Supabase professional update failed, using localStorage:', error);
      }
    }
    await delay();
    const items = getCollection<Professional>(KEYS.PROFESSIONALS);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error("Professional not found");
    items[index] = { ...items[index], ...data };
    saveCollection(KEYS.PROFESSIONALS, items);
    return items[index];
  },
  delete: async (id: string): Promise<void> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('professionals').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.warn('Supabase professional delete failed, using localStorage:', error);
      }
    }
    await delay();
    const items = getCollection<Professional>(KEYS.PROFESSIONALS);
    saveCollection(KEYS.PROFESSIONALS, items.filter(i => i.id !== id));
  }
};

// --- Agendamentos ---
export const dbAppointments = {
  getAll: async (): Promise<Appointment[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('appointments').select('*');
        if (error) throw error;
        if (data) return data.map(mapAppointmentFromDB);
      } catch (error) {
        console.warn('Supabase appointments fetch failed, using localStorage:', error);
      }
    }
    await delay();
    return getCollection<Appointment>(KEYS.APPOINTMENTS);
  },
  create: async (data: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> => {
    if (isSupabaseConfigured()) {
      try {
        const newItem: Appointment = {
          ...data,
          id: `apt${Date.now()}`,
          status: AppointmentStatus.PENDING
        };
        // Garantir que o usuário existe na tabela `users` antes de inserir o agendamento.
        // Usamos `maybeSingle()` para não lançar erro se não houver linha, e `upsert` para garantir
        // criação/upsert atômico. Caso o upsert falhe (ex: RLS), abortamos a tentativa de inserir o
        // agendamento no Supabase e caímos para o fallback localStorage.
        try {
          const { data: existingUser, error: fetchErr } = await supabase.from('users').select('*').eq('id', newItem.userId).maybeSingle();
          if (fetchErr) {
            console.warn('Error fetching user before appointment insert:', fetchErr);
          }
          if (!existingUser) {
            const userToCreate: User = {
              id: newItem.userId,
              name: newItem.userName || 'Visitante',
              email: newItem.clientEmail || '',
              role: newItem.userId?.startsWith('guest') ? ('GUEST' as Role) : ('CLIENT' as Role),
              avatarUrl: ''
            };

            const { data: upsertedUser, error: userUpsertError } = await supabase
              .from('users')
              .upsert([mapUserToDB(userToCreate)])
              .select()
              .maybeSingle();

            if (userUpsertError) {
              console.warn('Supabase user upsert failed while creating appointment:', userUpsertError);
              if (userUpsertError.code === '42501' || (userUpsertError?.message && String(userUpsertError.message).toLowerCase().includes('row-level security'))) {
                console.warn('\nRow-Level Security is blocking inserts to `users`. To fix, run the following SQL in Supabase SQL Editor (development only):\n');
                console.warn("-- Allow public inserts on users (for development)\nCREATE POLICY \"Allow public insert on users\" ON users FOR INSERT USING (true) WITH CHECK (true);\n\n-- Or disable RLS temporarily (not recommended for production)\nALTER TABLE users DISABLE ROW LEVEL SECURITY;\n");
              }
              // If we can't create the user in Supabase, throw to avoid a FK violation when inserting appointment
              throw userUpsertError;
            }

            if (upsertedUser) {
              const users = getCollection<User>(KEYS.USERS);
              users.push(mapUserFromDB(upsertedUser));
              saveCollection(KEYS.USERS, users);
            }
          }
        } catch (uErr) {
          console.warn('Error ensuring user exists before appointment insert — aborting Supabase appointment insert and falling back to localStorage:', uErr);
          throw uErr;
        }
        // Insert appointment with retry on foreign-key violation (23503)
        try {
          const { data: created, error } = await supabase
            .from('appointments')
            .insert([mapAppointmentToDB(newItem)])
            .select()
            .single();
          if (error) throw error;
          if (created) {
            const mapped = mapAppointmentFromDB(created);
            const items = getCollection<Appointment>(KEYS.APPOINTMENTS);
            items.push(mapped);
            saveCollection(KEYS.APPOINTMENTS, items);
            return mapped;
          }
        } catch (insErr: any) {
          // If FK violation because user is missing, try to upsert the user and retry once
          const code = insErr?.code || (insErr?.details && insErr.details.code) || null;
          console.warn('Supabase appointment insert error:', insErr);
          if (code === '23503' || (insErr?.message && String(insErr.message).toLowerCase().includes('foreign key'))) {
            console.warn('Foreign key violation detected while inserting appointment — attempting to ensure user exists and retry.');
            try {
              const userToCreate: User = {
                id: newItem.userId,
                name: newItem.userName || 'Visitante',
                email: newItem.clientEmail || '',
                role: newItem.userId?.startsWith('guest') ? ('GUEST' as Role) : ('CLIENT' as Role),
                avatarUrl: ''
              };
              const { data: upsertedUser2, error: userUpsertError2 } = await supabase
                .from('users')
                .upsert([mapUserToDB(userToCreate)])
                .select()
                .maybeSingle();
              if (userUpsertError2) {
                console.warn('Retry user upsert failed:', userUpsertError2);
                throw userUpsertError2;
              }
              if (upsertedUser2) {
                const users = getCollection<User>(KEYS.USERS);
                users.push(mapUserFromDB(upsertedUser2));
                saveCollection(KEYS.USERS, users);
              }
              // Retry appointment insert once
              const { data: created2, error: error2 } = await supabase
                .from('appointments')
                .insert([mapAppointmentToDB(newItem)])
                .select()
                .single();
              if (error2) throw error2;
              if (created2) {
                const mapped2 = mapAppointmentFromDB(created2);
                const items2 = getCollection<Appointment>(KEYS.APPOINTMENTS);
                items2.push(mapped2);
                saveCollection(KEYS.APPOINTMENTS, items2);
                return mapped2;
              }
            } catch (retryErr) {
              console.warn('Retry after user upsert failed, falling back to localStorage:', retryErr);
              throw retryErr;
            }
          }
          throw insErr;
        }
      } catch (error) {
        console.warn('Supabase appointment create failed, using localStorage:', error);
      }
    }
    await delay();
    const items = getCollection<Appointment>(KEYS.APPOINTMENTS);
    const newItem: Appointment = { 
      ...data, 
      id: `apt${Date.now()}`,
      status: AppointmentStatus.PENDING 
    };
    items.push(newItem);
    saveCollection(KEYS.APPOINTMENTS, items);
    return newItem;
  },
  updateStatus: async (id: string, status: AppointmentStatus): Promise<Appointment> => {
    if (isSupabaseConfigured()) {
      try {
        const { data: updated, error } = await supabase
          .from('appointments')
          .update({ status })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        if (updated) {
          const mapped = mapAppointmentFromDB(updated);
          const items = getCollection<Appointment>(KEYS.APPOINTMENTS);
          const index = items.findIndex(i => i.id === id);
          if (index !== -1) {
            items[index] = mapped;
            saveCollection(KEYS.APPOINTMENTS, items);
          }
          return mapped;
        }
      } catch (error) {
        console.warn('Supabase appointment status update failed, using localStorage:', error);
      }
    }
    await delay();
    const items = getCollection<Appointment>(KEYS.APPOINTMENTS);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error("Appointment not found");
    items[index] = { ...items[index], status };
    saveCollection(KEYS.APPOINTMENTS, items);
    return items[index];
  },
  addReview: async (id: string, rating: number, comment: string): Promise<Appointment> => {
    if (isSupabaseConfigured()) {
      try {
        const { data: updated, error } = await supabase
          .from('appointments')
          .update({ rating, review_comment: comment })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        if (updated) {
          const mapped = mapAppointmentFromDB(updated);
          const items = getCollection<Appointment>(KEYS.APPOINTMENTS);
          const index = items.findIndex(i => i.id === id);
          if (index !== -1) {
            items[index] = mapped;
            saveCollection(KEYS.APPOINTMENTS, items);
          }
          return mapped;
        }
      } catch (error) {
        console.warn('Supabase appointment review add failed, using localStorage:', error);
      }
    }
    await delay();
    const items = getCollection<Appointment>(KEYS.APPOINTMENTS);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error("Appointment not found");
    items[index] = { ...items[index], rating, reviewComment: comment };
    saveCollection(KEYS.APPOINTMENTS, items);
    return items[index];
  }
};

// --- Users (Apenas Leitura/Login simulado para Admin e Guest) ---
export const dbUsers = {
    getById: async (id: string): Promise<User | null> => {
        await delay();
    if (id.startsWith('guest')) return null; // Guest is handled in memory context
    const users = getCollection<User>(KEYS.USERS);
    const found = users.find(u => u.id === id) || null;
    if (found) return found;
    // Fallback to mock users if not found in storage (helps during dev)
    const mock = MOCK_USERS.find(u => u.id === id) || null;
    if (mock) {
      console.log('dbUsers.getById: falling back to MOCK_USERS for id=', id);
      return mock;
    }
    console.log('dbUsers.getById: user not found id=', id);
    return null;
    }
};

// --- Configuração ---
export const dbConfig = {
    get: async (): Promise<BusinessConfig> => {
        if (isSupabaseConfigured()) {
          try {
            const { data, error } = await supabase.from('config').select('*').single();
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            if (data) return data;
          } catch (error) {
            console.warn('Supabase config fetch failed, using localStorage:', error);
          }
        }
        await delay();
        const data = safeLocalStorage.getItem(KEYS.CONFIG);
        return data ? JSON.parse(data) : MOCK_BUSINESS_CONFIG;
    },
    save: async (config: BusinessConfig): Promise<BusinessConfig> => {
        if (isSupabaseConfigured()) {
          try {
            const { data, error } = await supabase
              .from('config')
              .upsert(config)
              .select()
              .single();
            if (error) throw error;
            if (data) {
              safeLocalStorage.setItem(KEYS.CONFIG, JSON.stringify(data));
              return data;
            }
          } catch (error) {
            console.warn('Supabase config save failed, using localStorage:', error);
          }
        }
        await delay();
        safeLocalStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
        return config;
    }
}