import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Scoreboard', icon: '\u{1F3C6}' },
  { to: '/map', label: 'Map', icon: '\u{1F5FA}' },
  { to: '/stats', label: 'Stats', icon: '\u{1F4CA}' },
  { to: '/manage', label: 'Manage', icon: '\u{2699}' },
];

export default function Nav() {
  return (
    <nav style={styles.nav}>
      <ul style={styles.list}>
        {tabs.map((tab) => (
          <li key={tab.to} style={styles.item}>
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              style={({ isActive }) => ({
                ...styles.link,
                color: isActive ? '#F4C55C' : '#E7DED0',
                borderBottomColor: isActive ? '#F4C55C' : 'transparent',
              })}
            >
              <span style={styles.icon}>{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    background: '#241636',
    borderBottom: '1px solid #3a2a52',
    flexShrink: 0,
  },
  list: {
    display: 'flex',
    justifyContent: 'center',
    listStyle: 'none',
    gap: 4,
    padding: 0,
    margin: 0,
  },
  item: {
    display: 'flex',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    borderBottom: '2.5px solid transparent',
    transition: 'color 150ms ease, border-color 150ms ease',
    letterSpacing: '0.02em',
  },
  icon: {
    fontSize: 16,
    lineHeight: 1,
  },
};
