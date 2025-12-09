import React from 'react';

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
}
export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', fullWidth, className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-500",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };
  
  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

// Card
export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 ${className}`}>
    {children}
  </div>
);

// Badge
export const Badge: React.FC<{ color?: string, children: React.ReactNode }> = ({ color = 'blue', children }) => {
    // Using inline style for specific dynamic colors or simple classes
    const colors: Record<string, string> = {
        green: 'bg-green-100 text-green-800',
        blue: 'bg-blue-100 text-blue-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        red: 'bg-red-100 text-red-800',
        gray: 'bg-gray-100 text-gray-800',
        pink: 'bg-pink-100 text-pink-800'
    };
    
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>
            {children}
        </span>
    );
}

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-900 mb-1">{label}</label>}
    <input 
      className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900 ${className}`}
      {...props}
    />
  </div>
);

// Modal
export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">{title}</h3>
                        <div className="mt-2">
                            {children}
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <Button variant="outline" onClick={onClose} className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Fechar</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}