import React, { useState } from 'react';
import { Wrench, Plus, Search, ArrowLeft, Trash2, Edit2, X, Check, Building2, MapPin, Gauge } from 'lucide-react';
import { Machine, Client } from '../types';
import { MachineBadge } from './MachineBadge';

interface MachinesViewProps {
  machines: Machine[];
  clients: Client[];
  onBack?: () => void;
  onSaveMachine: (machine: Partial<Machine>) => Promise<void>;
  onDeleteMachine: (id: string) => Promise<void>;
  embedded?: boolean;
}

export const MachinesView: React.FC<MachinesViewProps> = ({
  machines,
  clients,
  onBack,
  onSaveMachine,
  onDeleteMachine,
  embedded = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPavilhao, setSelectedPavilhao] = useState<'TODOS' | 'P1' | 'P2'>('TODOS');
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Machine>>({
    name: '',
    model: '',
    tonnage: '',
    pavilhao: 'P1',
    serialNumber: '',
    tag: '',
    clientName: clients[0]?.name || 'Oppeano',
    horometer: '',
    location: '',
    manufacturer: ''
  });

  const p1Count = machines.filter(m => m.pavilhao === 'P1' || m.location?.includes('P1')).length;
  const p2Count = machines.filter(m => m.pavilhao === 'P2' || m.location?.includes('P2')).length;

  const filteredMachines = machines.filter(m => {
    // Pavilion filter
    if (selectedPavilhao === 'P1') {
      const isP1 = m.pavilhao === 'P1' || (m.location && m.location.includes('P1')) || (m.tag && m.tag.includes('0') && parseInt(m.tag.replace(/\D/g, '') || '0') <= 13);
      if (!isP1) return false;
    } else if (selectedPavilhao === 'P2') {
      const isP2 = m.pavilhao === 'P2' || (m.location && m.location.includes('P2')) || (m.tag && /[A-O]/i.test(m.tag.replace('INJ.', '').trim()));
      if (!isP2) return false;
    }

    // Search filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(term) ||
      m.model.toLowerCase().includes(term) ||
      (m.tonnage && m.tonnage.toLowerCase().includes(term)) ||
      (m.tag && m.tag.toLowerCase().includes(term)) ||
      (m.clientName && m.clientName.toLowerCase().includes(term)) ||
      (m.manufacturer && m.manufacturer.toLowerCase().includes(term))
    );
  });

  const handleOpenAdd = () => {
    setFormData({
      id: `maq_${Date.now()}`,
      name: '',
      model: '',
      tonnage: '',
      pavilhao: selectedPavilhao === 'P2' ? 'P2' : 'P1',
      serialNumber: '',
      tag: '',
      clientName: clients[0]?.name || 'Oppeano',
      horometer: '',
      location: selectedPavilhao === 'P2' ? 'Produção 2 (P2)' : 'Produção 1 (P1)',
      manufacturer: ''
    });
    setEditingMachine(null);
    setIsNewModalOpen(true);
  };

  const handleOpenEdit = (mach: Machine) => {
    setFormData({ ...mach });
    setEditingMachine(mach);
    setIsNewModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    setIsSaving(true);
    try {
      await onSaveMachine(formData);
      setIsNewModalOpen(false);
      setEditingMachine(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setMachineToDelete(id);
  };

  const confirmDeleteMachine = async () => {
    if (!machineToDelete) return;
    const targetId = machineToDelete;
    setMachineToDelete(null);
    await onDeleteMachine(targetId);
  };

  return (
    <div className={embedded ? "space-y-4" : "min-h-screen bg-slate-100 flex flex-col pb-20"}>
      {/* Top Header (only if not embedded) */}
      {!embedded && (
        <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 shadow-xs">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>
              )}
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Máquinas e Injetoras</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {machines.length} cadastradas • P1: {p1Count} | P2: {p2Count}
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAdd}
              className="h-10 px-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Máquina</span>
            </button>
          </div>
        </div>
      )}

      {/* Embedded Top Header Banner */}
      {embedded && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Parque de Máquinas & Injetoras</h3>
              <p className="text-xs text-slate-500 font-medium">
                {machines.length} cadastradas • P1: {p1Count} | P2: {p2Count}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="h-10 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Máquina</span>
          </button>
        </div>
      )}

      <div className={embedded ? "space-y-4" : "max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-4"}>
        {/* Pavilion Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-200/70 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setSelectedPavilhao('TODOS')}
            className={`py-2.5 text-xs font-black rounded-xl transition-all ${
              selectedPavilhao === 'TODOS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            TODAS ({machines.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedPavilhao('P1')}
            className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedPavilhao === 'P1'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-blue-900'
            }`}
          >
            <span>PRODUÇÃO 1 (P1)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedPavilhao === 'P1' ? 'bg-blue-800 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              {p1Count} maq
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPavilhao('P2')}
            className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedPavilhao === 'P2'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-blue-900'
            }`}
          >
            <span>PRODUÇÃO 2 (P2)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedPavilhao === 'P2' ? 'bg-blue-800 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              {p2Count} maq
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por TAG, modelo, tonelagem (ex: 250t)..."
            className="w-full h-12 pl-11 pr-4 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-600 transition-colors shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Machine Cards */}
        {filteredMachines.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-700">Nenhuma máquina encontrada</p>
            <p className="text-xs text-slate-400 mt-1">
              Verifique os filtros ou cadastre pelo botão "+ Nova Máquina".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredMachines.map((mach) => (
              <div
                key={mach.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Highlighted Machine Icon with Number or Letter */}
                    <MachineBadge machine={mach} size="md" />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        {mach.tag && (
                          <span className="text-[11px] font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            {mach.tag}
                          </span>
                        )}

                        {mach.tonnage && (
                          <span className="text-[11px] font-black text-amber-950 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-amber-700" />
                            <span>{mach.tonnage}</span>
                          </span>
                        )}

                        {mach.pavilhao && (
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {mach.pavilhao === 'P1' ? 'Produção 1' : mach.pavilhao === 'P2' ? 'Produção 2' : mach.pavilhao}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                        {mach.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold truncate">
                        {mach.model || 'Injetora'} {mach.manufacturer ? `• ${mach.manufacturer}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(mach)}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(mach.id)}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">Modelo:</span>
                    <span className="font-bold text-slate-800">{mach.model || '---'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">Tonelagem:</span>
                    <span className="font-bold text-amber-800">{mach.tonnage || '---'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">Produção:</span>
                    <span className="font-bold text-slate-800">{mach.pavilhao || (mach.location?.includes('P1') ? 'P1' : mach.location?.includes('P2') ? 'P2' : '---')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">Fabricante:</span>
                    <span className="font-bold text-slate-800">{mach.manufacturer || '---'}</span>
                  </div>
                </div>

                {mach.location && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{mach.location}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Machine Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900">
                {editingMachine ? 'Editar Máquina' : 'Cadastrar Nova Máquina'}
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nome do Equipamento / Injetora *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: INJ. 01 - STARMACH 55"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Tonelagem (t) *
                  </label>
                  <input
                    type="text"
                    value={formData.tonnage || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tonnage: e.target.value }))}
                    placeholder="Ex: 55 t, 120 t, 250 t"
                    className="w-full h-10 px-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Produção
                  </label>
                  <select
                    value={formData.pavilhao || 'P1'}
                    onChange={(e) => {
                      const pav = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        pavilhao: pav,
                        location: pav === 'P1' ? 'Produção 1 (P1)' : pav === 'P2' ? 'Produção 2 (P2)' : prev.location
                      }));
                    }}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  >
                    <option value="P1">Produção 1 (P1)</option>
                    <option value="P2">Produção 2 (P2)</option>
                    <option value="Geral">Geral / Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Modelo</label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="Ex: STARMACH 55"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">TAG / Código</label>
                  <input
                    type="text"
                    value={formData.tag || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}
                    placeholder="Ex: INJ. 01 ou INJ. A"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-blue-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Fabricante</label>
                  <input
                    type="text"
                    value={formData.manufacturer || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                    placeholder="Ex: Haitian, Tianjian, Starmach"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Nº de Série</label>
                  <input
                    type="text"
                    value={formData.serialNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                    placeholder="Ex: SN-12345"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Localização na Fábrica</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Produção 1 (P1)"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 h-12 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-12 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Máquina'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {machineToDelete && (() => {
        const targetMach = machines.find(m => m.id === machineToDelete);
        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-1">Excluir Máquina?</h3>
              {targetMach && (
                <div className="my-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-sm font-black text-slate-900 leading-tight">
                    {targetMach.name}
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {targetMach.model} {targetMach.tag ? `• TAG: ${targetMach.tag}` : ''}
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-500 mb-5">
                Esta ação removerá esta máquina permanentemente de todos os dispositivos.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMachineToDelete(null)}
                  className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteMachine}
                  className="h-12 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
