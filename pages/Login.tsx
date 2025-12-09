import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { MOCK_USERS } from '../mockData';
import { Role } from '../types';
import { Card, Button, Input } from '../components/Shared';
import { Lock, User, ChevronLeft, LogIn, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [view, setView] = useState<'select' | 'admin'>('select');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const adminUser = MOCK_USERS.find(u => u.role === Role.ADMIN);

  const handleClientLogin = () => {
      // Login anônimo/Visitante
      login('guest');
  };

  const handleAdminLogin = () => {
      if (password === '123456') { // Senha hardcoded para demo
          if (adminUser) {
              login(adminUser.id);
          }
      } else {
          setError('Senha incorreta. Tente "123456".');
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center space-y-8 p-8 shadow-xl border-none">
        <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                <Sparkles size={32} />
            </div>
            <h1 className="text-3xl font-bold text-primary-800 mb-2">Salão Eliane Melo</h1>
            <p className="text-slate-500">Beleza e bem-estar ao seu alcance.</p>
        </div>

        {view === 'select' ? (
            <div className="space-y-4">
                <button 
                    onClick={handleClientLogin}
                    className="w-full group relative flex items-center p-4 border border-primary-100 bg-white rounded-xl hover:shadow-md hover:border-primary-300 transition-all text-left"
                >
                    <div className="p-3 bg-primary-50 rounded-full mr-4 group-hover:bg-primary-600 group-hover:text-white transition-colors text-primary-600">
                        <User size={24} />
                    </div>
                    <div>
                        <div className="font-semibold text-lg text-slate-900">Sou Cliente</div>
                        <p className="text-sm text-slate-500">Agendar horário ou ver serviços</p>
                    </div>
                </button>

                <button 
                    onClick={() => setView('admin')}
                    className="w-full group relative flex items-center p-4 border border-slate-100 bg-slate-50 rounded-xl hover:shadow-md hover:bg-white transition-all text-left"
                >
                    <div className="p-3 bg-slate-200 rounded-full mr-4 group-hover:bg-slate-800 group-hover:text-white transition-colors text-slate-600">
                        <Lock size={24} />
                    </div>
                    <div>
                        <div className="font-semibold text-lg text-slate-900">Área Administrativa</div>
                        <p className="text-sm text-slate-500">Gerenciar agenda e configurações</p>
                    </div>
                </button>
            </div>
        ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-left">
                    <button onClick={() => { setView('select'); setError(''); setPassword(''); }} className="text-sm text-slate-500 hover:text-slate-800 flex items-center mb-4">
                        <ChevronLeft size={16} className="mr-1"/> Voltar
                    </button>
                    <h2 className="text-xl font-semibold text-slate-900 mb-1">Login Administrativo</h2>
                    <p className="text-sm text-slate-400 mb-4">Digite sua senha para continuar.</p>
                </div>

                <Input 
                    type="password" 
                    placeholder="Senha" 
                    value={password} 
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    className="text-center tracking-widest"
                    autoFocus
                />
                
                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                <Button fullWidth onClick={handleAdminLogin} className="flex items-center justify-center">
                    <LogIn size={18} className="mr-2" /> Entrar
                </Button>
            </div>
        )}
        
        <div className="text-xs text-slate-400 pt-8 border-t border-slate-100">
            {view === 'admin' ? 'Dica: A senha é 123456' : 'Sistema de Agendamento Online'}
        </div>
      </Card>
    </div>
  );
};