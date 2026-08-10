import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function Spinner({
  size = 'md',
  label = 'Loading',
}: SpinnerProps) {
  return (
    <div
      className={`spinner spinner-${size}`}
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}
