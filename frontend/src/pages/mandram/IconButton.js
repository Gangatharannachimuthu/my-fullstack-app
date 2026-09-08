import React from 'react';

function IconButton({ icon: Icon, variant = 'edit', title, onClick, disabled, type = 'button', size = 15 }) {
  return (
    <button
      type={type}
      className={`icon-btn icon-btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
    >
      <Icon size={size} />
    </button>
  );
}

export default IconButton;
