import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, X, Check, Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'pink' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight = false,
  loading = false,
  loadingText,
  disabled,
  className = '',
  ...props
}) => {
  const isButtonDisabled = disabled || loading;
  const classes = `btn btn-${variant === 'primary' ? 'primary-pink' : variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`;
  
  return (
    <button className={classes} disabled={isButtonDisabled} {...props}>
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>{loadingText || children || 'Menyimpan...'}</span>
        </>
      ) : (
        <>
          {!iconRight && icon && <span className="flex-center">{icon}</span>}
          {children}
          {iconRight && icon && <span className="flex-center">{icon}</span>}
        </>
      )}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, className = '', ...props }, ref) => {
    return (
      <div className="input-group">
        {label && (
          <label className="input-label">
            {label}
            {required && <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`input-field ${error ? 'error' : ''} ${className}`}
          {...props}
        />
        {error && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '4px' }}>{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string; addon?: string }>;
  placeholder?: string;
  required?: boolean;
}

export const Select: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    userSelect: 'none',
    padding: '0.5rem 0.85rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    fontWeight: selectedOption ? 600 : 400,
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.825rem',
    color: selectedOption ? 'var(--text-main)' : 'var(--text-muted)',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    width: '100%',
  };

  const arrowStyle: React.CSSProperties = {
    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s ease',
    color: 'var(--text-muted)',
    flexShrink: 0,
  };

  const popoverStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '0.35rem',
    backgroundColor: '#ffffff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
    zIndex: 9999,
    width: '100%',
    minWidth: '200px',
    maxHeight: '320px',
    overflowY: 'auto',
    padding: '0.35rem',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%' }}>
      {label && (
        <label className="input-label" style={{ marginBottom: '0.375rem', display: 'block' }}>
          {label}
          {required && <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>}
        </label>
      )}

      <button type="button" onClick={() => setIsOpen(!isOpen)} style={btnStyle}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} style={arrowStyle} />
      </button>

      {isOpen && (
        <div style={popoverStyle} className="dropdown-popover-animate no-scrollbar">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            const itemStyle: React.CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 0.85rem',
              fontSize: '0.85rem',
              fontFamily: "'Poppins', sans-serif",
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: isSelected ? 600 : 400,
              backgroundColor: isSelected ? 'var(--pink-light)' : 'transparent',
              color: isSelected ? 'var(--primary-pink)' : 'var(--text-main)',
            };

            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={itemStyle}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                  {isSelected && <Check size={14} color="var(--primary-pink)" style={{ flexShrink: 0 }} />}
                  <span>{opt.label}</span>
                </div>
                {opt.addon && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600 }}>{opt.addon}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============ MULTI SELECT ============
interface MultiSelectProps {
  label?: string;
  values: string[];
  onChange: (vals: string[]) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  selectAllLabel?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  values,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  required = false,
  selectAllLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleValue = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const toggleAll = () => {
    if (values.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  const selectedLabels = values
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean);

  const displayText =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join(', ')
        : `${selectedLabels.length} dipilih`;

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    userSelect: 'none',
    padding: '0.5rem 0.85rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    fontWeight: values.length > 0 ? 600 : 400,
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.825rem',
    color: values.length > 0 ? 'var(--text-main)' : 'var(--text-muted)',
    textAlign: 'left',
    width: '100%',
    minHeight: '40px',
  };

  const popoverStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '0.35rem',
    backgroundColor: '#ffffff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
    zIndex: 9999,
    width: '100%',
    minWidth: '200px',
    maxHeight: '280px',
    overflowY: 'auto',
    padding: '0.35rem',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%' }}>
      {label && (
        <label className="input-label" style={{ marginBottom: '0.375rem', display: 'block' }}>
          {label}
          {required && <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>}
        </label>
      )}

      <button type="button" onClick={() => setIsOpen(!isOpen)} style={btnStyle}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {displayText}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          {values.length > 0 && (
            <span style={{
              backgroundColor: 'var(--primary-pink)', color: '#fff',
              fontSize: '0.65rem', fontWeight: 700, borderRadius: '9999px',
              padding: '1px 7px', lineHeight: '1.4',
            }}>
              {values.length}
            </span>
          )}
          <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'var(--text-muted)' }} />
        </div>
      </button>

      {values.length > 0 && values.length <= 5 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
          {selectedLabels.map((lbl, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              backgroundColor: '#fdf2f8', color: '#9d174d', fontSize: '0.72rem',
              fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '9999px', border: '1px solid #fbcfe8',
            }}>
              {lbl}
              <X size={12} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => toggleValue(values[i])} />
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <div style={popoverStyle} className="dropdown-popover-animate no-scrollbar">
          {selectAllLabel && (
            <div
              onClick={toggleAll}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.55rem 0.85rem', fontSize: '0.85rem', fontFamily: "'Poppins', sans-serif",
                borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 700,
                backgroundColor: values.length === options.length ? 'var(--pink-light)' : 'transparent',
                color: values.length === options.length ? 'var(--primary-pink)' : 'var(--text-main)',
                borderBottom: '1px solid var(--border)', marginBottom: '0.25rem',
              }}
              onMouseEnter={(e) => { if (values.length !== options.length) (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'; }}
              onMouseLeave={(e) => { if (values.length !== options.length) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: 4,
                border: values.length === options.length ? '2px solid var(--primary-pink)' : '2px solid #cbd5e1',
                backgroundColor: values.length === options.length ? 'var(--primary-pink)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {values.length === options.length && <Check size={11} color="#fff" />}
              </div>
              <span>{selectAllLabel}</span>
            </div>
          )}

          {options.map((opt) => {
            const isChecked = values.includes(opt.value);
            return (
              <div
                key={opt.value}
                onClick={() => toggleValue(opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.55rem 0.85rem', fontSize: '0.85rem', fontFamily: "'Poppins', sans-serif",
                  borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontWeight: isChecked ? 600 : 400,
                  backgroundColor: isChecked ? 'var(--pink-light)' : 'transparent',
                  color: isChecked ? 'var(--primary-pink)' : 'var(--text-main)',
                }}
                onMouseEnter={(e) => { if (!isChecked) (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'; }}
                onMouseLeave={(e) => { if (!isChecked) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: isChecked ? '2px solid var(--primary-pink)' : '2px solid #cbd5e1',
                  backgroundColor: isChecked ? 'var(--primary-pink)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {isChecked && <Check size={11} color="#fff" />}
                </div>
                <span>{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-modern">
          <h2>{title}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body-modern">{children}</div>
        {footer && <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`badge ${className}`}>{children}</span>
);

/* Skeleton Loader Components for Cute Shimmer Loading */
export const SkeletonBox: React.FC<{ width?: string; height?: string; borderRadius?: string; style?: React.CSSProperties }> = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md)',
  style,
}) => (
  <div
    className="skeleton-shimmer"
    style={{
      width,
      height,
      borderRadius,
      ...style,
    }}
  />
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => (
  <div className="table-container">
    <table className="data-table">
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <th key={cIdx} style={{ padding: '0.875rem 1.25rem' }}>
              <SkeletonBox width={cIdx === 0 ? '60px' : '100px'} height="16px" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <tr key={rIdx}>
            {Array.from({ length: cols }).map((_, cIdx) => (
              <td key={cIdx} style={{ padding: '0.875rem 1.25rem' }}>
                <SkeletonBox
                  width={cIdx === 0 ? '70%' : cIdx === cols - 1 ? '50px' : '90%'}
                  height="18px"
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SkeletonCards: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <SkeletonBox width="48px" height="48px" borderRadius="var(--radius-lg)" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <SkeletonBox width="60%" height="16px" />
            <SkeletonBox width="40%" height="14px" />
          </div>
        </div>
        <SkeletonBox width="100%" height="40px" borderRadius="var(--radius-md)" />
      </div>
    ))}
  </div>
);

