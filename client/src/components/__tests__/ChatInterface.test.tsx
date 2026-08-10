import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChatInterface from '../ChatInterface';
import type { Message } from '../../types';

describe('ChatInterface', () => {
  const mockRef = { current: null };

  it('renders empty state when no messages', () => {
    render(
      <ChatInterface
        messages={[]}
        loading={false}
        messagesEndRef={mockRef}
      />
    );
    expect(screen.getByText(/Welcome to LangCoach/i)).toBeInTheDocument();
  });

  it('renders user and assistant messages', () => {
    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello, coach',
        timestamp: new Date(),
        type: 'text',
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        timestamp: new Date(),
        type: 'text',
      },
    ];

    render(
      <ChatInterface
        messages={messages}
        loading={false}
        messagesEndRef={mockRef}
      />
    );

    expect(screen.getByText('Hello, coach')).toBeInTheDocument();
    expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
  });

  it('shows loading indicator when loading', () => {
    render(
      <ChatInterface
        messages={[]}
        loading={true}
        messagesEndRef={mockRef}
      />
    );
    expect(screen.getByLabelText(/Coach is thinking/i)).toBeInTheDocument();
  });

  it('renders messages with correct roles', () => {
    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
        type: 'text',
      },
    ];

    const { container } = render(
      <ChatInterface
        messages={messages}
        loading={false}
        messagesEndRef={mockRef}
      />
    );

    const messageEl = container.querySelector('.message-user');
    expect(messageEl).toBeInTheDocument();
  });

  it('displays voice badge for voice messages', () => {
    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Test voice message',
        timestamp: new Date(),
        type: 'voice',
      },
    ];

    render(
      <ChatInterface
        messages={messages}
        loading={false}
        messagesEndRef={mockRef}
      />
    );

    expect(screen.getByText('Voice')).toBeInTheDocument();
  });
});
