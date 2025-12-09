import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Appointment, AppointmentStatus, Service, Professional, BusinessConfig } from '../../types';
import { Button, Card, Badge, Input, Modal } from '../../components/Shared';
import { Calendar as CalendarIcon, Users, Scissors, MessageCircle, TrendingUp, Plus, Trash2, Check, X, Clock, Pencil, Briefcase, Settings, Loader2, Coffee } from 'lucide-react';
import { generateWhatsAppMessage } from '../../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminDashboard: React.FC = () => {
  const { logout } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'services' | 'professionals' | 'settings'>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
           <h1 className="text-2xl font-bold text-primary-400">Salão Eliane Melo</h1>
           <p className="text-xs text-slate-400 mt-1">Painel Administrativo</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<TrendingUp size={20}/>}>Dashboard</NavButton>
           <NavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<CalendarIcon size={20}/>}>Agenda</NavButton>
           <NavButton active={activeTab === 'services'} onClick={() => setActiveTab('services')} icon={<Scissors size={20}/>}>Serviços</NavButton>
           <NavButton active={activeTab === 'professionals'} onClick={() => setActiveTab('professionals')} icon={<Users size={20}/>}>Profissionais</NavButton>
           <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20}/>}>Configurações</NavButton>
        </nav>
        <div className="p-4 border-t border-slate-800">
            <button onClick={logout} className="flex items-center text-slate-400 hover:text-white w-full px-4 py-2">
                <X size={20} className="mr-2" /> Sair
            </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
         <header className="bg-white shadow-sm p-4 md:hidden flex justify-between items-center">
             <span className="font-bold text-lg text-slate-900">Salão Eliane Melo Admin</span>
             <button onClick={logout}><X /></button>
         </header>

         {/* Content */}
         <main className="flex-1 overflow-y-auto p-6">
             {activeTab === 'dashboard' && <DashboardOverview />}
             {activeTab === 'calendar' && <CalendarManager />}
             {activeTab === 'services' && <ServicesManager />}
             {activeTab === 'professionals' && <ProfessionalsManager />}
             {activeTab === 'settings' && <SettingsManager />}
         </main>

         {/* Mobile Bottom Nav */}
         <div className="md:hidden bg-white border-t flex justify-around p-3 overflow-x-auto">
            <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-primary-600' : 'text-slate-400'}><TrendingUp /></button>
            <button onClick={() => setActiveTab('calendar')} className={activeTab === 'calendar' ? 'text-primary-600' : 'text-slate-400'}><CalendarIcon /></button>
            <button onClick={() => setActiveTab('services')} className={activeTab === 'services' ? 'text-primary-600' : 'text-slate-400'}><Scissors /></button>
            <button onClick={() => setActiveTab('professionals')} className={activeTab === 'professionals' ? 'text-primary-600' : 'text-slate-400'}><Users /></button>
            <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-primary-600' : 'text-slate-400'}><Settings /></button>
         </div>
      </div>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, children: React.ReactNode }> = ({ active, onClick, icon, children }) => (
    <button onClick={onClick} className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${active ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <span className="mr-3">{icon}</span>
        {children}
    </button>
);

// --- Sub-Views ---

const DashboardOverview: React.FC = () => {
    const { appointments } = useApp();
    
    const totalApts = appointments.length;
    const confirmed = appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length;
    const revenue = appointments
        .filter(a => a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.CONFIRMED)
        .length * 120; // Mock average price calculation for simplicity

    const chartData = [
        { name: 'Seg', apts: 4 },
        { name: 'Ter', apts: 3 },
        { name: 'Qua', apts: 6 },
        { name: 'Qui', apts: 8 },
        { name: 'Sex', apts: 12 },
        { name: 'Sab', apts: 10 },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Visão Geral</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Agendamentos Totais" value={totalApts} icon={<CalendarIcon className="text-blue-500" />} />
                <StatCard title="Confirmados" value={confirmed} icon={<Check className="text-green-500" />} />
                <StatCard title="Receita Estimada" value={`R$ ${revenue}`} icon={<TrendingUp className="text-purple-500" />} />
            </div>

            <Card className="h-80">
                <h3 className="text-lg font-semibold mb-4 text-slate-900">Agendamentos por Dia</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="apts" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    )
}

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
        <div className="p-3 bg-slate-50 rounded-lg mr-4">{icon}</div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
    </div>
);

const CalendarManager: React.FC = () => {
    const { appointments, updateAppointmentStatus, services, professionals, addAppointment } = useApp();
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    // State for New Appointment Modal
    const [isNewAptModalOpen, setIsNewAptModalOpen] = useState(false);
    const [newAptForm, setNewAptForm] = useState({
        userName: '',
        serviceId: '',
        professionalId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00'
    });
    const [conflictError, setConflictError] = useState<string>('');

    const handleStatusChange = (id: string, newStatus: AppointmentStatus) => {
        updateAppointmentStatus(id, newStatus);
    };

    const handleGenerateMessage = async (apt: Appointment) => {
        setIsGenerating(apt.id);
        const service = services.find(s => s.id === apt.serviceId);
        const pro = professionals.find(p => p.id === apt.professionalId);
        
        if (service && pro) {
            const msg = await generateWhatsAppMessage(apt, service, pro);
            const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        }
        setIsGenerating(null);
    };

    // Verify scheduling conflicts
    const checkConflicts = (): string => {
        if (!newAptForm.professionalId || !newAptForm.date || !newAptForm.time) {
            return '';
        }

        const service = services.find(s => s.id === newAptForm.serviceId);
        if (!service) return '';

        const newAptStart = parseInt(newAptForm.time.replace(':', ''));
        const newAptDuration = service.durationMinutes;
        const newAptEnd = newAptStart + (newAptDuration % 100) + Math.floor(newAptDuration / 60) * 100;

        // Check for conflicts with existing appointments for the same professional
        const conflicts = appointments.filter(apt => {
            // Same professional, same date, and not cancelled
            if (apt.professionalId !== newAptForm.professionalId || apt.date !== newAptForm.date || apt.status === AppointmentStatus.CANCELLED) {
                return false;
            }

            const existingAptStart = parseInt(apt.time.replace(':', ''));
            const existingService = services.find(s => s.id === apt.serviceId);
            const existingDuration = existingService ? existingService.durationMinutes : 60;
            const existingAptEnd = existingAptStart + (existingDuration % 100) + Math.floor(existingDuration / 60) * 100;

            // Check for time overlap
            return newAptStart < existingAptEnd && newAptEnd > existingAptStart;
        });

        if (conflicts.length > 0) {
            const conflictClient = conflicts[0].userName;
            const conflictTime = conflicts[0].time;
            return `Conflito de horário detectado! O profissional ${professionals.find(p => p.id === newAptForm.professionalId)?.name || 'selecionado'} já possui um agendamento em ${conflictTime} com ${conflictClient}.`;
        }

        return '';
    };

    const handleSubmitNewApt = () => {
        setConflictError('');
        
        if (newAptForm.userName && newAptForm.serviceId && newAptForm.professionalId && newAptForm.date && newAptForm.time) {
            const error = checkConflicts();
            if (error) {
                setConflictError(error);
                return;
            }

            addAppointment({
                userId: `guest-${Date.now()}`,
                userName: newAptForm.userName,
                serviceId: newAptForm.serviceId,
                professionalId: newAptForm.professionalId,
                date: newAptForm.date,
                time: newAptForm.time
            });
            setIsNewAptModalOpen(false);
            setConflictError('');
            // Reset form
            setNewAptForm({
                userName: '',
                serviceId: '',
                professionalId: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                time: '09:00'
            });
        }
    };

    const filteredProfessionals = newAptForm.serviceId 
        ? professionals.filter(p => p.specialties.includes(newAptForm.serviceId))
        : [];

    // Sort by date/time (simplified)
    const sortedApts = [...appointments].sort((a, b) => b.id.localeCompare(a.id));

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Gerenciar Agenda</h2>
                <Button onClick={() => setIsNewAptModalOpen(true)}>Novo Agendamento</Button>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">Serviço</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">Data/Hora</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedApts.map(apt => {
                            const serviceName = services.find(s => s.id === apt.serviceId)?.name || 'Unknown';
                            return (
                                <tr key={apt.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{apt.userName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{serviceName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{format(parseISO(apt.date), 'dd/MM')} - {apt.time}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select 
                                            value={apt.status} 
                                            onChange={(e) => handleStatusChange(apt.id, e.target.value as AppointmentStatus)}
                                            className="text-xs rounded-full px-2 py-1 bg-slate-100 border-none focus:ring-0 cursor-pointer text-slate-900"
                                        >
                                            {Object.values(AppointmentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button 
                                            onClick={() => handleGenerateMessage(apt)}
                                            disabled={isGenerating === apt.id}
                                            className="text-green-600 hover:text-green-900 flex items-center"
                                            title="Enviar WhatsApp IA"
                                        >
                                            <MessageCircle size={18} className="mr-1"/>
                                            {isGenerating === apt.id ? '...' : 'WhatsApp'}
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
             </div>

             <Modal isOpen={isNewAptModalOpen} onClose={() => setIsNewAptModalOpen(false)} title="Novo Agendamento">
                <div className="space-y-4">
                    {conflictError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{conflictError}</p>
                        </div>
                    )}
                    <Input 
                        label="Nome do Cliente" 
                        value={newAptForm.userName} 
                        onChange={e => setNewAptForm({...newAptForm, userName: e.target.value})} 
                        placeholder="Ex: Maria Silva"
                    />
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">Serviço</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
                            value={newAptForm.serviceId}
                            onChange={e => setNewAptForm({...newAptForm, serviceId: e.target.value, professionalId: ''})}
                        >
                            <option value="">Selecione um serviço</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">Profissional</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
                            value={newAptForm.professionalId}
                            onChange={e => setNewAptForm({...newAptForm, professionalId: e.target.value})}
                            disabled={!newAptForm.serviceId}
                        >
                            <option value="">{newAptForm.serviceId ? "Selecione um profissional" : "Selecione um serviço primeiro"}</option>
                            {filteredProfessionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            type="date" 
                            label="Data" 
                            value={newAptForm.date} 
                            onChange={e => setNewAptForm({...newAptForm, date: e.target.value})} 
                        />
                        <Input 
                            type="time" 
                            label="Horário" 
                            value={newAptForm.time} 
                            onChange={e => setNewAptForm({...newAptForm, time: e.target.value})} 
                        />
                    </div>

                    <Button fullWidth onClick={handleSubmitNewApt} className="mt-4">Confirmar Agendamento</Button>
                </div>
            </Modal>
        </div>
    );
}

const ServicesManager: React.FC = () => {
    const { services, deleteService, addService, updateService } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [serviceForm, setServiceForm] = useState<Partial<Service>>({ name: '', price: 0, durationMinutes: 60, imageUrl: '' });
    const [imagePreview, setImagePreview] = useState<string>('');

    const handleAddNew = () => {
        setEditingId(null);
        setServiceForm({ name: '', price: 0, durationMinutes: 60, imageUrl: '' });
        setImagePreview('');
        setIsModalOpen(true);
    };

    const handleEdit = (service: Service) => {
        setEditingId(service.id);
        setServiceForm({ ...service });
        setImagePreview(service.imageUrl || '');
        setIsModalOpen(true);
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                setServiceForm({ ...serviceForm, imageUrl: result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (serviceForm.name && serviceForm.price) {
            if (editingId) {
                updateService(editingId, serviceForm);
            } else {
                addService({
                    name: serviceForm.name!,
                    price: Number(serviceForm.price),
                    durationMinutes: Number(serviceForm.durationMinutes || 60),
                    description: serviceForm.description || 'Novo serviço',
                    imageUrl: serviceForm.imageUrl || `https://picsum.photos/400/300?random=${Date.now()}`
                });
            }
            setIsModalOpen(false);
            setServiceForm({ name: '', price: 0, durationMinutes: 60, imageUrl: '' });
            setImagePreview('');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Serviços</h2>
                <Button onClick={handleAddNew}><Plus size={18} className="mr-1" /> Novo Serviço</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                    <Card key={service.id} className="group relative hover:shadow-md transition-shadow">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                             <button onClick={() => handleEdit(service)} className="p-2 bg-white rounded-full shadow text-blue-500 hover:bg-blue-50"><Pencil size={16}/></button>
                             <button onClick={() => deleteService(service.id)} className="p-2 bg-white rounded-full shadow text-red-500 hover:bg-red-50"><Trash2 size={16}/></button>
                        </div>
                        <div className="flex items-center mb-4">
                            <img 
                                src={service.imageUrl} 
                                className="w-16 h-16 rounded-lg object-cover mr-4" 
                                alt={service.name}
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Sem+Imagem'; }}
                            />
                            <div>
                                <h3 className="font-bold text-slate-900">{service.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-primary-600 font-semibold">R$ {service.price.toFixed(2)}</span>
                                    <span className="text-xs text-slate-400 flex items-center bg-slate-100 px-1.5 py-0.5 rounded"><Clock size={10} className="mr-1"/>{service.durationMinutes}min</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2">{service.description}</p>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Serviço" : "Adicionar Serviço"}>
                <div className="space-y-4">
                    <Input label="Nome do Serviço" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} />
                    <Input label="Descrição" value={serviceForm.description || ''} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                         <Input type="number" label="Preço (R$)" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: parseFloat(e.target.value)})} />
                         <Input 
                            type="number" 
                            label="Duração (minutos)" 
                            value={serviceForm.durationMinutes} 
                            onChange={e => setServiceForm({...serviceForm, durationMinutes: parseInt(e.target.value)})} 
                            placeholder="Ex: 60"
                         />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Imagem do Serviço</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <p className="text-sm text-slate-500">Clique para selecionar uma imagem</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                        {imagePreview && (
                            <div className="mt-4">
                                <p className="text-sm text-slate-600 mb-2">Prévia da imagem:</p>
                                <img src={imagePreview} alt="Prévia" className="w-full h-40 object-cover rounded-lg" />
                            </div>
                        )}
                    </div>
                    <Button fullWidth onClick={handleSubmit} className="mt-4">Salvar</Button>
                </div>
            </Modal>
        </div>
    )
}

const ProfessionalsManager: React.FC = () => {
    const { professionals, services, addProfessional, updateProfessional, deleteProfessional } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [proForm, setProForm] = useState<Partial<Professional>>({ name: '', avatarUrl: '', specialties: [] });

    const handleAddNew = () => {
        setEditingId(null);
        setProForm({ name: '', avatarUrl: '', specialties: [] });
        setIsModalOpen(true);
    };

    const handleEdit = (pro: Professional) => {
        setEditingId(pro.id);
        setProForm({ ...pro });
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (proForm.name) {
            const newProData = {
                name: proForm.name,
                avatarUrl: proForm.avatarUrl || `https://ui-avatars.com/api/?name=${proForm.name}&background=random`,
                specialties: proForm.specialties || []
            };

            if (editingId) {
                updateProfessional(editingId, newProData);
            } else {
                addProfessional(newProData);
            }
            setIsModalOpen(false);
        }
    };

    const toggleSpecialty = (serviceId: string) => {
        const currentSpecialties = proForm.specialties || [];
        if (currentSpecialties.includes(serviceId)) {
            setProForm({ ...proForm, specialties: currentSpecialties.filter(id => id !== serviceId) });
        } else {
            setProForm({ ...proForm, specialties: [...currentSpecialties, serviceId] });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Profissionais</h2>
                <Button onClick={handleAddNew}><Plus size={18} className="mr-1" /> Novo Profissional</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {professionals.map(pro => (
                    <Card key={pro.id} className="group relative hover:shadow-md transition-shadow">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                             <button onClick={() => handleEdit(pro)} className="p-2 bg-white rounded-full shadow text-blue-500 hover:bg-blue-50"><Pencil size={16}/></button>
                             <button onClick={() => deleteProfessional(pro.id)} className="p-2 bg-white rounded-full shadow text-red-500 hover:bg-red-50"><Trash2 size={16}/></button>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <img 
                                src={pro.avatarUrl} 
                                className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-white shadow-sm" 
                                alt={pro.name}
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${pro.name}`; }}
                            />
                            <h3 className="font-bold text-lg text-slate-900">{pro.name}</h3>
                            <p className="text-sm text-slate-500 mb-3">{pro.specialties.length} Especialidades</p>
                            
                            <div className="flex flex-wrap justify-center gap-1">
                                {pro.specialties.slice(0, 3).map(specId => {
                                    const s = services.find(s => s.id === specId);
                                    return s ? <Badge key={s.id} color="gray">{s.name}</Badge> : null;
                                })}
                                {pro.specialties.length > 3 && <Badge color="gray">+{pro.specialties.length - 3}</Badge>}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Profissional" : "Novo Profissional"}>
                <div className="space-y-4">
                    <Input label="Nome Completo" value={proForm.name} onChange={e => setProForm({...proForm, name: e.target.value})} />
                    <Input label="URL do Avatar (Opcional)" value={proForm.avatarUrl || ''} onChange={e => setProForm({...proForm, avatarUrl: e.target.value})} placeholder="https://..." />
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">Especialidades (Serviços)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 border rounded-lg">
                            {services.map(service => {
                                const isSelected = proForm.specialties?.includes(service.id);
                                return (
                                    <div 
                                        key={service.id} 
                                        onClick={() => toggleSpecialty(service.id)}
                                        className={`p-2 rounded-md text-sm border cursor-pointer flex items-center justify-between ${isSelected ? 'bg-primary-50 border-primary-500 text-primary-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <span className="truncate mr-2">{service.name}</span>
                                        {isSelected && <Check size={14} className="text-primary-600" />}
                                    </div>
                                )
                            })}
                            {services.length === 0 && <p className="text-xs text-slate-400 p-2">Cadastre serviços primeiro.</p>}
                        </div>
                    </div>
                    
                    <Button fullWidth onClick={handleSubmit} className="mt-4">Salvar Profissional</Button>
                </div>
            </Modal>
        </div>
    );
}

const SettingsManager: React.FC = () => {
    const { businessConfig, updateBusinessConfig } = useApp();
    const [localConfig, setLocalConfig] = useState<BusinessConfig>(businessConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const daysOfWeek = [
        { id: 0, label: 'Domingo' },
        { id: 1, label: 'Segunda-feira' },
        { id: 2, label: 'Terça-feira' },
        { id: 3, label: 'Quarta-feira' },
        { id: 4, label: 'Quinta-feira' },
        { id: 5, label: 'Sexta-feira' },
        { id: 6, label: 'Sábado' },
    ];

    const handleDayToggle = (dayId: number) => {
        setLocalConfig(prev => ({
            ...prev,
            days: {
                ...prev.days,
                [dayId]: { ...prev.days[dayId], isOpen: !prev.days[dayId].isOpen }
            }
        }));
    };

    const handleLunchToggle = (dayId: number) => {
        setLocalConfig(prev => ({
            ...prev,
            days: {
                ...prev.days,
                [dayId]: { ...prev.days[dayId], hasLunch: !prev.days[dayId].hasLunch }
            }
        }));
    };

    const handleTimeChange = (dayId: number, type: 'start' | 'end' | 'lunchStart' | 'lunchEnd', value: string) => {
        setLocalConfig(prev => ({
            ...prev,
            days: {
                ...prev.days,
                [dayId]: { ...prev.days[dayId], [type]: value }
            }
        }));
    };

    const handleSave = () => {
        setIsSaving(true);
        setSuccessMsg('');
        
        // Simular delay de rede para UX
        setTimeout(() => {
            updateBusinessConfig(localConfig);
            setIsSaving(false);
            setSuccessMsg('Salvo com sucesso!');
            
            // Remover mensagem após 3 segundos
            setTimeout(() => setSuccessMsg(''), 3000);
        }, 800);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Configurações de Horário</h2>
                <div className="flex items-center gap-3">
                    {successMsg && (
                        <span className="text-green-600 text-sm font-medium flex items-center animate-pulse">
                            <Check size={16} className="mr-1" /> {successMsg}
                        </span>
                    )}
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[140px]">
                        {isSaving ? (
                            <div className="flex items-center justify-center">
                                <Loader2 size={18} className="animate-spin mr-2" /> Salvando...
                            </div>
                        ) : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>

            <Card>
                <h3 className="font-medium text-lg mb-4 text-slate-900">Horário de Funcionamento</h3>
                <div className="space-y-4">
                    {daysOfWeek.map(day => {
                        const config = localConfig.days[day.id] || { isOpen: false, start: '09:00', end: '18:00', hasLunch: false, lunchStart: '12:00', lunchEnd: '13:00' };
                        return (
                            <div key={day.id} className="flex flex-col p-3 border rounded-lg bg-white gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={config.isOpen} 
                                            onChange={() => handleDayToggle(day.id)}
                                            className="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mr-3"
                                        />
                                        <span className={`font-medium ${config.isOpen ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {day.label}
                                        </span>
                                    </div>

                                    {config.isOpen ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center">
                                                <span className="text-xs text-slate-500 mr-2">Das</span>
                                                <input 
                                                    type="time" 
                                                    value={config.start} 
                                                    onChange={(e) => handleTimeChange(day.id, 'start', e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm text-slate-900"
                                                />
                                            </div>
                                            <span className="text-slate-400">-</span>
                                            <div className="flex items-center">
                                                <span className="text-xs text-slate-500 mr-2">Às</span>
                                                <input 
                                                    type="time" 
                                                    value={config.end} 
                                                    onChange={(e) => handleTimeChange(day.id, 'end', e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm text-slate-900"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">Fechado</span>
                                    )}
                                </div>

                                {config.isOpen && (
                                    <div className="ml-8 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-4">
                                        <div className="flex items-center">
                                            <input 
                                                type="checkbox" 
                                                id={`lunch-${day.id}`}
                                                checked={config.hasLunch} 
                                                onChange={() => handleLunchToggle(day.id)}
                                                className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400 mr-2"
                                            />
                                            <label htmlFor={`lunch-${day.id}`} className="text-sm text-slate-600 flex items-center">
                                                <Coffee size={14} className="mr-1 text-slate-400"/> Intervalo de Almoço
                                            </label>
                                        </div>

                                        {config.hasLunch && (
                                            <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                                <input 
                                                    type="time" 
                                                    value={config.lunchStart || ''} 
                                                    onChange={(e) => handleTimeChange(day.id, 'lunchStart', e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-xs text-slate-700"
                                                />
                                                <span className="text-slate-400 text-xs">até</span>
                                                <input 
                                                    type="time" 
                                                    value={config.lunchEnd || ''} 
                                                    onChange={(e) => handleTimeChange(day.id, 'lunchEnd', e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 text-xs text-slate-700"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};