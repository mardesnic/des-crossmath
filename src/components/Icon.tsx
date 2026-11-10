const PATHS = {
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  clear: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
};

export function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg
      className='icon'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
