import { CONTACT } from '../data.js';
import Icon from './Icons.jsx';

// Email / phone / location. Empty values in data.js show as "to be added" placeholders.
export default function ContactDetails({ className = '', compact = false }) {
  const items = [
    { icon: 'mail', label: 'Email', value: CONTACT.email, href: CONTACT.email && `mailto:${CONTACT.email}` },
    { icon: 'phone', label: 'Phone', value: CONTACT.phone.display, href: CONTACT.phone.tel && `tel:${CONTACT.phone.tel}` },
    { icon: 'pin', label: 'Address', value: CONTACT.address },
  ];

  return (
    <ul className={`details${compact ? ' details--compact' : ''} ${className}`}>
      {items.map((it) => (
        <li key={it.label} className="details__item">
          <span className="details__icon">
            <Icon name={it.icon} size={compact ? 16 : 20} />
          </span>
          <span>
            {!compact && <span className="details__label">{it.label}</span>}
            {it.value ? (
              it.href ? (
                <a href={it.href}>{it.value}</a>
              ) : (
                <span>{it.value}</span>
              )
            ) : (
              <span className="details__placeholder">
                {compact ? `${it.label}: ` : ''}Official {it.label.toLowerCase()} to be added
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
