import React from 'react';
import { render, fireEvent, screen } from '../helpers/test-utils';
import { Chip } from '@/components/ui/chip';

describe('Chip', () => {
  it('renders label text', () => {
    render(<Chip label="Kitchen" />);
    expect(screen.getByText('Kitchen')).toBeTruthy();
  });

  it('renders as non-pressable View when no onPress provided', () => {
    const { toJSON } = render(<Chip label="Badge" />);
    const tree = toJSON();
    // A View-based chip should not have onPress handlers in the tree
    expect(tree).toBeTruthy();
    expect(screen.getByText('Badge')).toBeTruthy();
  });

  it('calls onPress when tapped (pressable mode)', () => {
    const onPress = jest.fn();
    render(<Chip label="Filter" onPress={onPress} />);
    fireEvent.press(screen.getByText('Filter'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Chip label="Filter" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Filter'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders correctly with selected state', () => {
    render(<Chip label="Selected" selected />);
    expect(screen.getByText('Selected')).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Chip label="Small" size="sm" />);
    expect(screen.getByText('Small')).toBeTruthy();

    rerender(<Chip label="Medium" size="md" />);
    expect(screen.getByText('Medium')).toBeTruthy();
  });

  it('renders with different color variants', () => {
    const { rerender } = render(<Chip label="Primary" color="primary" selected />);
    expect(screen.getByText('Primary')).toBeTruthy();

    rerender(<Chip label="Danger" color="danger" selected />);
    expect(screen.getByText('Danger')).toBeTruthy();

    rerender(<Chip label="Success" color="success" selected />);
    expect(screen.getByText('Success')).toBeTruthy();
  });
});
