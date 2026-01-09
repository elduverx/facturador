'use client';

import { useState, useEffect } from 'react';
import { Settings } from '@/types';
import { storage } from '@/lib/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  onLogoChange: (logo: string | null) => void;
  onClearAll: () => void;
}

export function SettingsModal({ isOpen, onClose, onSave, onLogoChange, onClearAll }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>({ series: '2025-', nextNumber: 1, brandName: 'Factura' });

  useEffect(() => {
    setSettings(storage.getSettings());
  }, [isOpen]);

  const handleSave = () => {
    storage.saveSettings(settings);
    onSave(settings);
    onClose();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        storage.saveLogo(base64);
        onLogoChange(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearAll = () => {
    if (confirm('¿Estás seguro de que quieres borrar todos los datos guardados?')) {
      storage.clearAll();
      onClearAll();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-stone-200">
          <h3 className="text-lg font-semibold">Configuración</h3>
          <button className="btn-icon" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="section-title">Serie de facturación</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label block">Prefijo de serie</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.series}
                  onChange={(e) => setSettings({ ...settings, series: e.target.value })}
                  placeholder="2025-"
                />
              </div>
              <div>
                <label className="form-label block">Siguiente número</label>
                <input
                  type="number"
                  className="form-input"
                  value={settings.nextNumber}
                  onChange={(e) => setSettings({ ...settings, nextNumber: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="section-title">Nombre en cabecera</div>
            <input
              type="text"
              className="form-input"
              value={settings.brandName}
              onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
              placeholder="Factura"
            />
          </div>

          <div>
            <div className="section-title">Logo de empresa</div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="form-input"
            />
          </div>

          <div>
            <div className="section-title">Datos guardados</div>
            <button onClick={handleClearAll} className="btn btn-secondary w-full justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Borrar todos los datos guardados
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-stone-200">
          <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button onClick={handleSave} className="btn btn-primary">Guardar configuración</button>
        </div>
      </div>
    </div>
  );
}
