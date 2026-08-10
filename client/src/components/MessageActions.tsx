import { useCallback } from 'react';
import { useToast } from './Toast';
import './MessageActions.css';

interface MessageActionsProps {
  content: string;
  onDelete?: () => void;
}

export function MessageActions({
  content,
  onDelete,
}: MessageActionsProps) {
  const { show: showToast } = useToast();

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      showToast('Copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  }, [content, showToast]);

  return (
    <div className="message-actions">
      <button
        onClick={copyToClipboard}
        className="action-btn copy-btn"
        title="Copy message"
        aria-label="Copy message to clipboard"
      >
        Copy
      </button>
      {onDelete && (
        <button
          onClick={() => {
            if (confirm('Delete this message?')) {
              onDelete();
            }
          }}
          className="action-btn delete-btn"
          title="Delete message"
          aria-label="Delete message"
        >
          Delete
        </button>
      )}
    </div>
  );
}
