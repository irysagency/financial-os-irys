import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Subscription } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sub: Subscription) => void;
}

export const NewSubscriptionModal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Software (SaaS)');
  const [frequency, setFrequency] = useState('Monthly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: Math.random().toString(36).substr(2, 9),
      name: name || 'New Subscription',
      amount: parseFloat(amount) || 0,
      frequency: frequency as 'Monthly' | 'Yearly',
      category: category,
      status: 'Active',
      nextPaymentDate: 'Sep 01, 2024'
    });
    // Reset form
    setName('');
    setAmount('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* CONTENT */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-md h-fit z-[70] p-4"
          >
            <div className="bg-[#121212] border border-[#2A2A2A] rounded-3xl shadow-2xl overflow-hidden">
              
              <div className="p-6 pb-0 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">New Subscription</h3>
                <button onClick={onClose} className="text-muted hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                {/* TOOL NAME */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Tool Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Netflix" 
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] transition-all"
                  />
                </div>

                {/* AMOUNT & FREQUENCY */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider">Default Amount</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0" 
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white placeholder:text-muted/50 focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider">Frequency</label>
                    <select 
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] transition-all appearance-none"
                    >
                      <option>Monthly</option>
                      <option>Yearly</option>
                    </select>
                  </div>
                </div>

                {/* CATEGORY */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF4D00] transition-all appearance-none"
                  >
                    <option>Software (SaaS)</option>
                    <option>Entertainment</option>
                    <option>Utilities</option>
                  </select>
                </div>

                {/* STATUS */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Status:</span>
                  <div className="bg-[#1B5E20] text-[#4CAF50] px-3 py-1 rounded-full text-xs font-bold">
                    Active
                  </div>
                </div>

                {/* SUBMIT */}
                <button 
                  type="submit"
                  className="w-full bg-[#FF4D00] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(255,77,0,0.4)] hover:shadow-[0_6px_20px_rgba(255,77,0,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                >
                  Add Tool
                </button>

              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
