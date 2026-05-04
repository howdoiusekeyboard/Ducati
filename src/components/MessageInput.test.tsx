/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import MessageInput from './MessageInput';

describe('MessageInput (infra check)', () => {
  it('renders the textarea', () => {
    render(<MessageInput onSendMessage={() => {}} isLoading={false} />);
    expect(screen.getByLabelText(/type your message/i)).toBeInTheDocument();
  });
});
