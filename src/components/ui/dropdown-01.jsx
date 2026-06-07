import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

const Dropdown = ({ options, value, onChange, label, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="flex flex-col gap-2 relative w-full" ref={dropdownRef}>
      {label && (
        <label className="font-label text-[10px] tracking-[0.2em] uppercase text-primary-text/40 ml-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Dropdown Button */}
        <motion.button
          type="button"
          whileHover={!disabled ? { scale: 1.01 } : {}}
          whileTap={!disabled ? { scale: 0.99 } : {}}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 py-4 rounded-lg border transition-all duration-300 text-left flex items-center justify-between group h-[58px] ${
            isOpen 
              ? 'bg-background border-accent ring-1 ring-accent/20' 
              : 'bg-background/50 border-white/10 hover:border-white/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className={`font-body text-base ${value ? 'text-primary-text' : 'text-primary-text/40'}`}>
            {selectedOption ? selectedOption.label : 'Select an option'}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-primary-text/40 group-hover:text-accent transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute w-full mt-2 rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-[#0D0704] z-[100] backdrop-blur-xl"
            >
              <div className="py-2">
                {options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    onClick={() => handleSelect(option)}
                    className={`w-full px-5 py-3.5 text-left transition-all duration-200 flex items-center justify-between group font-body text-sm ${
                      value === option.value
                        ? 'bg-accent/10 text-accent'
                        : 'text-primary-text/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-medium tracking-wide">{option.label}</div>
                      {option.description && (
                        <div className="text-[10px] uppercase tracking-widest opacity-40 mt-0.5 group-hover:opacity-60">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {value === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dropdown;
