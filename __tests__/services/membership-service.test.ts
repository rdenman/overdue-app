import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  createHouseholdMember,
  getHouseholdMember,
  getHouseholdMembers,
  removeHouseholdMember,
} from '@/lib/services/membership-service';
import { buildHouseholdMember } from '../helpers/factories';

const mockDoc = doc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;

function mockDocRef(id: string = 'ref') {
  const ref = { id, withConverter: jest.fn().mockReturnThis() };
  mockDoc.mockReturnValue(ref);
  return ref;
}

function mockGetDocResult(data: Record<string, unknown> | null) {
  mockGetDoc.mockResolvedValue({
    exists: () => data !== null,
    data: () => data,
  });
}

function mockGetDocsResult(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  mockGetDocs.mockResolvedValue({
    empty: docs.length === 0,
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
      ref: { id: d.id },
    })),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// ── createHouseholdMember ──

describe('createHouseholdMember', () => {
  it('creates a member with composite ID and returns it', async () => {
    const ref = mockDocRef('h1_u1');
    mockSetDoc.mockResolvedValue(undefined);

    const result = await createHouseholdMember({
      householdId: 'h1',
      userId: 'u1',
      role: 'admin',
    });

    expect(result.id).toBe('h1_u1');
    expect(result.householdId).toBe('h1');
    expect(result.userId).toBe('u1');
    expect(result.role).toBe('admin');
    expect(result.joinedAt).toBeDefined();
    expect(mockSetDoc).toHaveBeenCalledWith(ref, expect.objectContaining({ id: 'h1_u1' }));
  });

  it('throws a friendly error when Firestore fails', async () => {
    mockDocRef();
    mockSetDoc.mockRejectedValue(new Error('network'));

    await expect(
      createHouseholdMember({ householdId: 'h1', userId: 'u1', role: 'member' })
    ).rejects.toThrow('Failed to add member to household');
  });
});

// ── getHouseholdMember ──

describe('getHouseholdMember', () => {
  it('returns the member when found', async () => {
    mockDocRef('h1_u1');
    const member = buildHouseholdMember({ householdId: 'h1', userId: 'u1' });
    mockGetDocResult(member as unknown as Record<string, unknown>);

    const result = await getHouseholdMember('h1', 'u1');

    expect(result).toEqual(member);
  });

  it('returns null when member does not exist', async () => {
    mockDocRef('h1_u99');
    mockGetDocResult(null);

    const result = await getHouseholdMember('h1', 'u99');

    expect(result).toBeNull();
  });

  it('throws a friendly error when Firestore fails', async () => {
    mockDocRef();
    mockGetDoc.mockRejectedValue(new Error('network'));

    await expect(getHouseholdMember('h1', 'u1')).rejects.toThrow(
      'Failed to load household member'
    );
  });
});

// ── getHouseholdMembers ──

describe('getHouseholdMembers', () => {
  it('returns all members for a household', async () => {
    const m1 = buildHouseholdMember({ householdId: 'h1', userId: 'u1' });
    const m2 = buildHouseholdMember({ householdId: 'h1', userId: 'u2', role: 'member' });

    mockGetDocsResult([
      { id: m1.id, data: m1 as unknown as Record<string, unknown> },
      { id: m2.id, data: m2 as unknown as Record<string, unknown> },
    ]);

    const result = await getHouseholdMembers('h1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(m1.id);
    expect(result[1].id).toBe(m2.id);
  });

  it('returns empty array when no members exist', async () => {
    mockGetDocsResult([]);

    const result = await getHouseholdMembers('h1');

    expect(result).toEqual([]);
  });

  it('throws a friendly error when Firestore fails', async () => {
    mockGetDocs.mockRejectedValue(new Error('network'));

    await expect(getHouseholdMembers('h1')).rejects.toThrow('Failed to load household members');
  });
});

// ── removeHouseholdMember ──

describe('removeHouseholdMember', () => {
  function setupRemoveScenario(opts: {
    requestingRole: 'admin' | 'member';
    memberExists?: boolean;
    allMembers?: Array<{ userId: string; role: 'admin' | 'member' }>;
  }) {
    const { requestingRole, memberExists = true, allMembers } = opts;

    const requestingMember = memberExists
      ? buildHouseholdMember({ householdId: 'h1', userId: 'requester', role: requestingRole })
      : null;

    // getHouseholdMember call (first getDoc)
    mockGetDoc.mockResolvedValueOnce({
      exists: () => requestingMember !== null,
      data: () => requestingMember as unknown as Record<string, unknown>,
    });

    if (allMembers) {
      mockGetDocsResult(
        allMembers.map((m) => ({
          id: `h1_${m.userId}`,
          data: buildHouseholdMember({
            householdId: 'h1',
            userId: m.userId,
            role: m.role,
          }) as unknown as Record<string, unknown>,
        }))
      );
    }

    mockDocRef('h1_target');
    mockDeleteDoc.mockResolvedValue(undefined);
  }

  it('allows admin to remove another member', async () => {
    setupRemoveScenario({ requestingRole: 'admin' });

    await removeHouseholdMember('h1', 'other-user', 'requester');

    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('allows member to remove themselves', async () => {
    setupRemoveScenario({ requestingRole: 'member' });

    await removeHouseholdMember('h1', 'requester', 'requester');

    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('rejects non-admin removing another member', async () => {
    setupRemoveScenario({ requestingRole: 'member' });

    await expect(
      removeHouseholdMember('h1', 'other-user', 'requester')
    ).rejects.toThrow('Only admins can remove other members');
  });

  it('rejects when requesting user is not a member', async () => {
    setupRemoveScenario({ requestingRole: 'admin', memberExists: false });

    await expect(
      removeHouseholdMember('h1', 'other-user', 'requester')
    ).rejects.toThrow('You are not a member of this household');
  });

  it('prevents last admin from leaving', async () => {
    setupRemoveScenario({
      requestingRole: 'admin',
      allMembers: [
        { userId: 'requester', role: 'admin' },
        { userId: 'u2', role: 'member' },
      ],
    });

    await expect(
      removeHouseholdMember('h1', 'requester', 'requester')
    ).rejects.toThrow('Cannot leave household as the last admin');
  });

  it('allows admin self-removal when another admin exists', async () => {
    setupRemoveScenario({
      requestingRole: 'admin',
      allMembers: [
        { userId: 'requester', role: 'admin' },
        { userId: 'u2', role: 'admin' },
      ],
    });

    await removeHouseholdMember('h1', 'requester', 'requester');

    expect(mockDeleteDoc).toHaveBeenCalled();
  });
});
