import React from 'react';

export type IconName =
  | 'arrow-left'
  | 'check'
  | 'close'
  | 'copy'
  | 'download'
  | 'eye'
  | 'info'
  | 'lock'
  | 'plus'
  | 'qr-code'
  | 'refresh'
  | 'send'
  | 'share'
  | 'shield'
  | 'snowflake'
  | 'trash';

interface Props extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

const paths: Record<IconName, React.ReactNode> = {
  'arrow-left': <><path d="m14.5 5-7 7 7 7" /><path d="M8 12h10" /></>,
  check: <path d="m5 12 4 4 10-10" />,
  close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  download: <><path d="M12 4v11" /><path d="m8 11 4 4 4-4" /><path d="M5 20h14" /></>,
  eye: <><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  'qr-code': <><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" /><path d="M14 14h2v2h-2zM18 14h2v4h-2zM14 18h4v2h-4zM20 20h.01" /></>,
  refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M18.2 9A7 7 0 0 0 6 6.8L4 9" /><path d="M5.8 15A7 7 0 0 0 18 17.2l2-2.2" /></>,
  send: <><path d="m4 4 17 8-17 8 3-8-3-8Z" /><path d="M7 12h14" /></>,
  share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5" /><path d="m8.2 13.2 7.6 4.5" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  snowflake: <><path d="M12 2v20M4.5 6.3l15 11.4M19.5 6.3l-15 11.4" /><path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2M5.2 9l.4 3.2-3 .8M18.8 15l-.4-3.2 3-.8M18.8 9l-.4 3.2 3 .8M5.2 15l.4-3.2-3-.8" /></>,
  trash: <><path d="M4 7h16" /><path d="m9 7 .7-3h4.6l.7 3" /><path d="m6 7 1 13h10l1-13" /><path d="M10 11v5M14 11v5" /></>,
};

const Icon: React.FC<Props> = ({ name, size = 20, className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    {paths[name]}
  </svg>
);

export default Icon;
