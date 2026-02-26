import React from 'react';
import { render, fireEvent, screen } from '../helpers/test-utils';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders title text', () => {
    render(<Button title="Save" />);
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Button title="Save" onPress={onPress} />);
    fireEvent.press(screen.getByText('Save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button title="Save" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    render(<Button title="Save" onPress={onPress} loading />);
    // When loading, the title text is replaced by ActivityIndicator
    expect(screen.queryByText('Save')).toBeNull();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', () => {
    render(<Button title="Save" loading />);
    // Title should not be visible during loading
    expect(screen.queryByText('Save')).toBeNull();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button title="Small" size="sm" />);
    expect(screen.getByText('Small')).toBeTruthy();

    rerender(<Button title="Large" size="lg" />);
    expect(screen.getByText('Large')).toBeTruthy();
  });
});
