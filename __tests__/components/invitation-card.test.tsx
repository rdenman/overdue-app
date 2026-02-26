import React from 'react';
import { render, fireEvent, screen, waitFor } from '../helpers/test-utils';
import { InvitationCard } from '@/components/invitation-card';
import { buildInvite, daysFromNow } from '../helpers/factories';

describe('InvitationCard', () => {
  const defaultProps = {
    onAccept: jest.fn().mockResolvedValue(undefined),
    onDecline: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders household name', () => {
    const invite = buildInvite({ householdName: 'Smith Family' });
    render(<InvitationCard invite={invite} {...defaultProps} />);
    expect(screen.getByText('Smith Family')).toBeTruthy();
  });

  it('renders inviter name', () => {
    const invite = buildInvite({ inviterName: 'John' });
    render(<InvitationCard invite={invite} {...defaultProps} />);
    expect(screen.getByText(/John/)).toBeTruthy();
  });

  it('renders role chip', () => {
    const invite = buildInvite({ role: 'admin' });
    render(<InvitationCard invite={invite} {...defaultProps} />);
    expect(screen.getByText('Admin')).toBeTruthy();
  });

  it('renders Member chip for member role', () => {
    const invite = buildInvite({ role: 'member' });
    render(<InvitationCard invite={invite} {...defaultProps} />);
    expect(screen.getByText('Member')).toBeTruthy();
  });

  it('shows expiry days', () => {
    const invite = buildInvite({ expiresAt: daysFromNow(5) });
    render(<InvitationCard invite={invite} {...defaultProps} />);
    expect(screen.getByText(/5 days/)).toBeTruthy();
  });

  it('renders Accept and Decline buttons', () => {
    const invite = buildInvite();
    render(<InvitationCard invite={invite} {...defaultProps} />);
    expect(screen.getByText('Accept')).toBeTruthy();
    expect(screen.getByText('Decline')).toBeTruthy();
  });

  it('calls onAccept with invite id when Accept is pressed', async () => {
    const onAccept = jest.fn().mockResolvedValue(undefined);
    const invite = buildInvite();
    render(<InvitationCard invite={invite} onAccept={onAccept} onDecline={defaultProps.onDecline} />);

    fireEvent.press(screen.getByText('Accept'));

    await waitFor(() => {
      expect(onAccept).toHaveBeenCalledWith(invite.id);
    });
  });

  it('calls onDecline with invite id when Decline is pressed', async () => {
    const onDecline = jest.fn().mockResolvedValue(undefined);
    const invite = buildInvite();
    render(<InvitationCard invite={invite} onAccept={defaultProps.onAccept} onDecline={onDecline} />);

    fireEvent.press(screen.getByText('Decline'));

    await waitFor(() => {
      expect(onDecline).toHaveBeenCalledWith(invite.id);
    });
  });
});
