import React from 'react';
import { render, fireEvent, screen } from '../helpers/test-utils';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('does not render label when not provided', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.queryByText('Email')).toBeNull();
  });

  it('renders error message when provided', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeTruthy();
  });

  it('does not render error when not provided', () => {
    render(<Input label="Name" />);
    expect(screen.queryByText('required')).toBeNull();
  });

  it('accepts text input', () => {
    const onChangeText = jest.fn();
    render(<Input placeholder="Type here" onChangeText={onChangeText} />);

    const input = screen.getByPlaceholderText('Type here');
    fireEvent.changeText(input, 'Hello');
    expect(onChangeText).toHaveBeenCalledWith('Hello');
  });

  it('renders with placeholder text', () => {
    render(<Input placeholder="Enter your name" />);
    expect(screen.getByPlaceholderText('Enter your name')).toBeTruthy();
  });
});
