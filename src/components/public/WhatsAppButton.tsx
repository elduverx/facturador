"use client";

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleWhatsApp = (lawyer: string) => {
    const numbers: Record<string, string> = {
      Diana: "34692170958",
      Luz: "34658969614"
    };
    const number = numbers[lawyer];
    const text = encodeURIComponent(`Hola ${lawyer}, me gustaría hacer una consulta.`);
    window.open(`https://wa.me/${number}?text=${text}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl mb-4 p-4 w-64 border border-gray-100 animate-fade-in-up">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-gray-800 text-sm">¿Con quién deseas hablar?</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-2">
            <button 
              onClick={() => handleWhatsApp('Diana')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-[#25D366]/10 hover:text-[#25D366] transition-colors border border-gray-100"
            >
              <span className="font-bold text-sm">Diana</span>
              <MessageCircle size={16} className="text-[#25D366]" />
            </button>
            <button 
              onClick={() => handleWhatsApp('Luz')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-[#25D366]/10 hover:text-[#25D366] transition-colors border border-gray-100"
            >
              <span className="font-bold text-sm">Luz</span>
              <MessageCircle size={16} className="text-[#25D366]" />
            </button>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300"
        aria-label="Contactar por WhatsApp"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>

      <style jsx>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.2s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
