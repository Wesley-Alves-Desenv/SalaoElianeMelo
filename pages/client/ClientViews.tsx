import React, { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Service, Professional, AppointmentStatus, Appointment } from '../../types';
import { Button, Card, Badge, Input } from '../../components/Shared';
import { Calendar, Clock, User as UserIcon, Star, Scissors, LogOut, Plus, ChevronLeft, Phone, Mail, Check } from 'lucide-react';
import { format, startOfToday, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateWhatsAppMessage } from '../../services/geminiService';

// Helper to convert "HH:mm" to minutes from midnight
const timeToMinutes = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

// Helper to convert minutes from midnight to "HH:mm"
const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const ClientDashboard: React.FC = () => {
  const { user, logout, appointments, services, professionals } = useApp();
  
  // Determine if user is a guest/visitor
  const isGuest = user?.id.startsWith('guest-');
  
  // Restrict view to 'home' or 'book' for guests, allow 'history' for registered users
  const [view, setView] = useState<'home' | 'history' | 'book'>('home');
  
  // Booking State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const resetBooking = () => {
    setSelectedService(null);
    setSelectedPro(null);
    setSelectedDate('');
    setSelectedTime('');
  };

  const myAppointments = useMemo(() => {
      return appointments
        .filter(a => a.userId === user?.id)
        .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [appointments, user?.id]);

  const upcoming = myAppointments.filter(a => 
    [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(a.status)
  );

  if (view === 'book') {
    return (
      <BookingWizard 
        onCancel={() => { resetBooking(); setView('home'); }}
        onSuccess={() => { resetBooking(); setView('home'); }}
        selectedService={selectedService}
        setSelectedService={setSelectedService}
        selectedPro={selectedPro}
        setSelectedPro={setSelectedPro}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
      />
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Olá, {user?.name.split(' ')[0]}</h1>
            <p className="text-sm text-slate-500">Bem-vindo ao Salão Eliane Melo</p>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-slate-600">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* HOME VIEW: Upcoming + Services */}
        {view === 'home' && (
          <>
            {/* Active Appointments Card */}
            {upcoming.length > 0 && (
               <section>
                 <h2 className="font-semibold text-lg mb-3 text-slate-900">Próximo Agendamento</h2>
                 {upcoming.slice(0, 1).map(apt => {
                   const service = services.find(s => s.id === apt.serviceId);
                   return (
                     <Card key={apt.id} className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-none">
                       <div className="flex justify-between items-start">
                         <div>
                           <h3 className="font-bold text-lg text-white">{service?.name}</h3>
                           <div className="flex items-center mt-1 text-primary-100">
                             <Calendar size={14} className="mr-1" />
                             <span className="text-sm">
                                {format(parseISO(apt.date), "dd 'de' MMMM", { locale: ptBR })}
                             </span>
                             <Clock size={14} className="ml-3 mr-1" />
                             <span className="text-sm">{apt.time}</span>
                           </div>
                         </div>
                         <Badge color="white" children={<span className="text-primary-600 font-bold">{apt.status}</span>} />
                       </div>
                     </Card>
                   )
                 })}
               </section>
            )}

            {/* All Services */}
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-semibold text-lg text-slate-900">Todos os Serviços</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services.map(service => (
                        <div
                            key={service.id}
                            className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => { setSelectedService(service); setView('book'); }}
                        >
                            <div className="h-40 bg-gray-200 relative">
                                <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-slate-900 truncate">{service.name}</h3>
                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{service.description}</p>
                                <div className="flex justify-between items-center mt-3">
                                    <p className="text-primary-600 font-bold text-sm">R$ {service.price.toFixed(2)}</p>
                                    <p className="text-xs text-slate-400">{service.durationMinutes} min</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
          </>
        )}
        
        {/* HISTORY VIEW: Full List - Only for registered users, not guests */}
        {view === 'history' && !isGuest && (
             <section>
                 <h2 className="font-semibold text-lg mb-3 text-slate-900">Histórico Completo</h2>
                 <div className="space-y-3">
                     {myAppointments.map(apt => {
                         const srv = services.find(s => s.id === apt.serviceId);
                         return (
                            <Card key={apt.id} className="flex justify-between items-center py-4">
                                <div>
                                    <p className="font-medium text-slate-900">{srv?.name}</p>
                                    <p className="text-sm text-slate-500">{format(parseISO(apt.date), 'dd/MM/yyyy')} às {apt.time}</p>
                                </div>
                                <Badge 
                                    color={
                                        apt.status === AppointmentStatus.CONFIRMED ? 'green' :
                                        apt.status === AppointmentStatus.CANCELLED ? 'red' : 'gray'
                                    }
                                >{apt.status}</Badge>
                            </Card>
                         )
                     })}
                     {myAppointments.length === 0 && (
                        <div className="text-center py-8 bg-white rounded-lg border border-dashed border-slate-300">
                            <p className="text-slate-500">Você ainda não tem agendamentos.</p>
                            <Button variant="outline" onClick={() => setView('home')} className="mt-2">Ver Serviços</Button>
                        </div>
                     )}
                 </div>
             </section>
        )}
      </main>

      {/* Floating Action Button or Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
          <div className="max-w-md mx-auto flex justify-around p-3">
              <button onClick={() => setView('home')} className={`flex flex-col items-center p-2 ${view === 'home' ? 'text-primary-600' : 'text-slate-400'}`}>
                  <Scissors size={24} />
                  <span className="text-xs mt-1">Serviços</span>
              </button>
              <button onClick={() => {resetBooking(); setView('book')}} className="flex flex-col items-center justify-center -mt-8 bg-primary-600 text-white rounded-full w-14 h-14 shadow-lg">
                  <Plus size={28} />
              </button>
              {!isGuest && (
                  <button onClick={() => setView('history')} className={`flex flex-col items-center p-2 ${view === 'history' ? 'text-primary-600' : 'text-slate-400'}`}>
                      <Calendar size={24} />
                      <span className="text-xs mt-1">Agenda</span>
                  </button>
              )}
          </div>
      </nav>
    </div>
  );
};

// Booking Component
const BookingWizard: React.FC<{
    onCancel: () => void,
    onSuccess: () => void,
    selectedService: Service | null, setSelectedService: (s: Service) => void,
    selectedPro: Professional | null, setSelectedPro: (p: Professional) => void,
    selectedDate: string, setSelectedDate: (d: string) => void,
    selectedTime: string, setSelectedTime: (t: string) => void
}> = ({ onCancel, onSuccess, selectedService, setSelectedService, selectedPro, setSelectedPro, selectedDate, setSelectedDate, selectedTime, setSelectedTime }) => {
    
    const { services, professionals, appointments, addAppointment, user, businessConfig } = useApp();
    const [step, setStep] = useState(selectedService ? 2 : 1);
    
    // Contact Info State
    const [guestName, setGuestName] = useState(user?.name || '');
    const [guestPhone, setGuestPhone] = useState('');
    const [guestEmail, setGuestEmail] = useState(user?.email || '');

    // Confirmation State
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

    // Auto-redirect to home after 5 seconds when confirmed
    React.useEffect(() => {
        if (isConfirmed) {
            const timer = setTimeout(() => {
                onSuccess();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isConfirmed, onSuccess]);

    const handleBook = async () => {
        if (selectedService && selectedPro && selectedDate && selectedTime && user && guestName && guestPhone) {
            setIsSendingWhatsApp(true);
            
            const newAppointment = await addAppointment({
                userId: user.id,
                userName: guestName, 
                clientPhone: guestPhone,
                clientEmail: guestEmail,
                serviceId: selectedService.id,
                professionalId: selectedPro.id,
                date: selectedDate,
                time: selectedTime,
            });
            
            // Generate WhatsApp message with booking summary
            try {
                const appointmentForMessage: Appointment = {
                    id: 'temp-' + Date.now(),
                    userId: user.id,
                    userName: guestName,
                    clientPhone: guestPhone,
                    clientEmail: guestEmail,
                    serviceId: selectedService.id,
                    professionalId: selectedPro.id,
                    date: selectedDate,
                    time: selectedTime,
                    status: AppointmentStatus.PENDING
                };
                
                const message = await generateWhatsAppMessage(appointmentForMessage, selectedService, selectedPro);
                
                // Open WhatsApp with the message
                const whatsappUrl = `https://wa.me/${guestPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            } catch (error) {
                console.error('Error generating WhatsApp message:', error);
            }
            
            setIsSendingWhatsApp(false);
            setIsConfirmed(true);
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    // Generate dates for remaining days of current month
    const today = startOfToday();
    const monthEnd = endOfMonth(today);
    
    const days = eachDayOfInterval({
        start: today,
        end: monthEnd
    });

    const availableDates = days.map(d => ({
        val: format(d, 'yyyy-MM-dd'),
        display: format(d, 'EEE dd', { locale: ptBR }),
        full: format(d, "dd 'de' MMMM", { locale: ptBR })
    }));

    // Calculate available time slots
    const { availableTimeSlots, dayIsClosed } = useMemo(() => {
        if (!selectedDate || !selectedPro || !selectedService) return { availableTimeSlots: [], dayIsClosed: false };

        // 1. Check global business hours for this day
        const dateObj = parseISO(selectedDate);
        const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
        const schedule = businessConfig.days[dayOfWeek];

        if (!schedule || !schedule.isOpen) {
            return { availableTimeSlots: [], dayIsClosed: true };
        }

        const workStart = timeToMinutes(schedule.start);
        const workEnd = timeToMinutes(schedule.end);
        
        // Check lunch break
        const hasLunch = schedule.hasLunch;
        const lunchStart = hasLunch ? timeToMinutes(schedule.lunchStart) : -1;
        const lunchEnd = hasLunch ? timeToMinutes(schedule.lunchEnd) : -1;
        
        const stepMinutes = 30;
        const serviceDuration = selectedService.durationMinutes;

        // 2. Get existing appointments for the selected pro on the selected date
        const proAppointments = appointments.filter(apt => 
            apt.professionalId === selectedPro.id && 
            apt.date === selectedDate && 
            apt.status !== AppointmentStatus.CANCELLED
        );

        // 3. Map occupied intervals
        const busyIntervals = proAppointments.map(apt => {
            const aptService = services.find(s => s.id === apt.serviceId);
            const duration = aptService ? aptService.durationMinutes : 60; // Default fallback
            const start = timeToMinutes(apt.time);
            return { start, end: start + duration };
        });

        // Add lunch to busy intervals if it exists
        if (hasLunch && lunchStart < lunchEnd) {
             busyIntervals.push({ start: lunchStart, end: lunchEnd });
        }

        const slots = [];
        for (let time = workStart; time < workEnd; time += stepMinutes) {
            const slotStart = time;
            const slotEnd = time + serviceDuration;

            // Check if slot ends after working hours
            if (slotEnd > workEnd) continue;

            // Check for collision with any busy interval (appointments OR lunch)
            const isBusy = busyIntervals.some(busy => {
                // Collision logic: (StartA < EndB) and (EndA > StartB)
                return slotStart < busy.end && slotEnd > busy.start;
            });

            if (!isBusy) {
                slots.push(minutesToTime(time));
            }
        }

        return { availableTimeSlots: slots, dayIsClosed: false };

    }, [selectedDate, selectedPro, selectedService, appointments, services, businessConfig]);

    // Success View
    if (isConfirmed && selectedService && selectedPro) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <Check size={40} className="text-green-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Agendamento Confirmado!</h2>
                <p className="text-slate-500 text-center mb-8">
                    Obrigado, {guestName.split(' ')[0]}.<br/>
                    Aqui está o resumo do seu horário.
                </p>

                <Card className="w-full max-w-sm mb-8 shadow-md border-green-100 bg-green-50/30">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600">
                                <Scissors size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Serviço</p>
                                <p className="font-semibold text-slate-900">{selectedService.name}</p>
                                <p className="text-sm text-slate-600">{selectedService.durationMinutes} min</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-3 border-t border-green-100 pt-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600">
                                <UserIcon size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Profissional</p>
                                <p className="font-semibold text-slate-900">{selectedPro.name}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 border-t border-green-100 pt-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Data e Hora</p>
                                <p className="font-semibold text-slate-900 capitalize">
                                    {format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                </p>
                                <p className="text-lg font-bold text-primary-700">{selectedTime}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-700">
                        ✓ Uma mensagem com o resumo do seu agendamento foi enviada para o WhatsApp <strong>({guestPhone})</strong>
                    </p>
                </div>

                <p className="text-xs text-slate-400 text-center mb-4">Redirecionando em alguns segundos...</p>
                <Button fullWidth onClick={onSuccess} className="max-w-sm">
                    Voltar para Tela Inicial
                </Button>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-white flex flex-col">
            <div className="p-4 border-b flex items-center">
                <Button variant="outline" onClick={step === 1 ? onCancel : prevStep} className="mr-2 border-none px-2">
                     <ChevronLeft size={24} />
                </Button>
                <div className="flex-1 text-center">
                    {selectedService && step > 1 && <div className="text-xs text-primary-600 font-medium mb-0.5">{selectedService.name} ({selectedService.durationMinutes} min)</div>}
                    <h2 className="font-bold text-lg leading-tight text-slate-900">
                        {step === 1 && "Escolha o Serviço"}
                        {step === 2 && "Escolha o Profissional"}
                        {step === 3 && "Data e Hora"}
                        {step === 4 && "Confirmar Dados"}
                    </h2>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {/* Step 1: Service */}
                {step === 1 && (
                    <div className="space-y-3">
                        {services.map(s => (
                            <div key={s.id} onClick={() => { setSelectedService(s); nextStep(); }} 
                                className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <img src={s.imageUrl} className="w-16 h-16 rounded-md object-cover mr-4" alt={s.name} />
                                <div className="flex-1">
                                    <h3 className="font-medium text-slate-900">{s.name}</h3>
                                    <p className="text-sm text-slate-500">{s.durationMinutes} min • R$ {s.price.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Step 2: Professional */}
                {step === 2 && selectedService && (
                    <div className="grid grid-cols-2 gap-4">
                        {professionals
                            .filter(p => p.specialties.includes(selectedService.id))
                            .map(p => (
                            <div key={p.id} onClick={() => { setSelectedPro(p); nextStep(); }}
                                className="flex flex-col items-center p-4 border rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all">
                                <img src={p.avatarUrl} className="w-20 h-20 rounded-full mb-3 object-cover" alt={p.name} />
                                <h3 className="font-medium text-slate-900">{p.name}</h3>
                            </div>
                        ))}
                    </div>
                )}

                {/* Step 3: Date & Time */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-medium mb-3 text-slate-900">Escolha o dia</h3>
                            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                {availableDates.map(d => (
                                    <button key={d.val} 
                                        onClick={() => { setSelectedDate(d.val); setSelectedTime(''); }}
                                        className={`flex-shrink-0 px-4 py-3 rounded-lg border text-center ${selectedDate === d.val ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-slate-200 text-slate-900'}`}>
                                        <div className={`text-xs uppercase font-bold ${selectedDate === d.val ? 'text-primary-100' : 'text-slate-500'}`}>{d.display.split(' ')[0]}</div>
                                        <div className="text-lg font-bold">{d.display.split(' ')[1]}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        {selectedDate && (
                            <div>
                                <h3 className="font-medium mb-3 text-slate-900">Horários disponíveis</h3>
                                {dayIsClosed ? (
                                    <div className="p-6 bg-red-50 rounded-lg text-center border border-red-100">
                                        <p className="text-red-800 font-medium">Fechado</p>
                                        <p className="text-sm text-red-600 mt-1">O estabelecimento não abre neste dia da semana.</p>
                                    </div>
                                ) : availableTimeSlots.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-2">
                                        {availableTimeSlots.map(t => (
                                            <button key={t} 
                                                onClick={() => setSelectedTime(t)}
                                                className={`py-2 rounded-md text-sm font-medium ${selectedTime === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-slate-900 hover:bg-gray-200'}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm p-4 bg-gray-50 rounded-lg text-center">
                                        Nenhum horário disponível para este dia com este profissional para a duração do serviço ({selectedService?.durationMinutes} min).
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Confirmation & Data */}
                {step === 4 && selectedService && selectedPro && (
                    <div className="space-y-6">
                        <Card>
                           <h3 className="text-slate-500 text-sm uppercase tracking-wide font-semibold mb-4">Resumo do pedido</h3>
                           <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Serviço</span>
                                    <span className="font-medium text-slate-900">{selectedService.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Duração Estimada</span>
                                    <span className="font-medium text-slate-900">{selectedService.durationMinutes} min</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Profissional</span>
                                    <span className="font-medium text-slate-900">{selectedPro.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Data e Hora</span>
                                    <span className="font-medium text-slate-900">{format(new Date(selectedDate), 'dd/MM')} às {selectedTime}</span>
                                </div>
                                <div className="border-t pt-4 flex justify-between items-center">
                                    <span className="text-lg font-bold text-slate-900">Total</span>
                                    <span className="text-xl font-bold text-primary-600">R$ {selectedService.price.toFixed(2)}</span>
                                </div>
                           </div>
                        </Card>

                        <div className="space-y-4 pt-2">
                            <h3 className="font-medium text-slate-900">Seus Dados de Contato</h3>
                            <Input 
                                label="Nome Completo (Obrigatório)" 
                                value={guestName} 
                                onChange={e => setGuestName(e.target.value)} 
                                placeholder="Seu nome"
                            />
                            <Input 
                                label="Telefone / WhatsApp (Obrigatório)" 
                                value={guestPhone} 
                                onChange={e => setGuestPhone(e.target.value)} 
                                placeholder="(XX) 9XXXX-XXXX"
                                type="tel"
                            />
                            <Input 
                                label="Email (Opcional)" 
                                value={guestEmail} 
                                onChange={e => setGuestEmail(e.target.value)} 
                                placeholder="email@exemplo.com"
                                type="email"
                            />
                        </div>

                        <p className="text-xs text-slate-500 text-center">
                            Ao confirmar, você concorda com nossa política de cancelamento de 24 horas.
                        </p>
                    </div>
                )}
            </div>

            <div className="p-4 border-t">
                {step === 3 && (
                    <Button fullWidth disabled={!selectedDate || !selectedTime} onClick={nextStep}>Continuar</Button>
                )}
                {step === 4 && (
                    <Button fullWidth disabled={!guestName || !guestPhone || isSendingWhatsApp} onClick={handleBook}>
                        {isSendingWhatsApp ? 'Enviando WhatsApp...' : 'Confirmar Agendamento'}
                    </Button>
                )}
            </div>
        </div>
    );
}