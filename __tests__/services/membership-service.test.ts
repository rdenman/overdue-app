import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
} from '@react-native-firebase/firestore';
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
const mockCollection = collection as jest.Mock;
const mockQuery = query as jest.Mock;
const mockWhere = where as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});

  mockDoc.mockReturnValue({ id: 'mock-id' });
  mockCollection.mockReturnValue('mock-collection-ref');
  mockQuery.mockReturnValue('mock-query-ref');
  mockWhere.mockReturnValue('mock-where-constraint');
  mockSetDoc.mockResolvedValue(undefined);
  mockDeleteDoc.mockResolvedValue(undefined);
});

// ── createHouseholdMember ──

describe('createHouseholdMember', () => {
  it('creates a member with composite ID and returns it', async () => {
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
    expect(mockSetDoc).toHaveBeenCalled();
  });

  it('throws a friendly error when Firestore fails', async () => {
    mockSetDoc.mockRejectedValue(new Error('network'));

    await expect(
      createHouseholdMember({ householdId: 'h1', userId: 'u1', role: 'member' })
    ).rejects.toThrow('Failed to add member to household');
  });
});

// ── getHouseholdMember ──

describe('getHouseholdMember', () => {
  it('returns the member when found', async () => {
    const member = buildHouseholdMember({ householdId: 'h1', userId: 'u1' });
    mockGetDoc.mockResolvedValue({
      exists: true,
      data: () => member,
    });

    const { householdMemberConverter } = require('@/lib/firebase/converters');
    householdMemberConverter.fromSnapshot.mockReturnValue(member);

    const result = await getHouseholdMember('h1', 'u1');

    expect(result).toEqual(member);
  });

  it('returns null when member does not exist', async () => {
    mockGetDoc.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });

    const { householdMemberConverter } = require('@/lib/firebase/converters');
    householdMemberConverter.fromSnapshot.mockReturnValue(null);

    const result = await getHouseholdMember('h1', 'u99');

    expect(result).toBeNull();
  });

  it('throws a friendly error when Firestore fails', async () => {
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

    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [
        { id: m1.id, data: () => m1 as unknown as Record<string, unknown> },
        { id: m2.id, data: () => m2 as unknown as Record<string, unknown> },
      ],
    });

    const result = await getHouseholdMembers('h1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(m1.id);
    expect(result[1].id).toBe(m2.id);
  });

  it('returns empty array when no members exist', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

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

    const { householdMemberConverter } = require('@/lib/firebase/converters');

    // getDoc is called for getHouseholdMember lookups
    let getDocCallCount = 0;
    mockGetDoc.mockImplementation(() => {
      getDocCallCount++;
      if (getDocCallCount === 1) {
        householdMemberConverter.fromSnapshot.mockReturnValueOnce(requestingMember);
        return Promise.resolve({
          exists: requestingMember !== null,
          data: () => requestingMember,
        });
      }
      return Promise.resolve({ exists: false, data: () => undefined });
    });

    // getDocs is called for getHouseholdMembers (when checking admin count)
    if (allMembers) {
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: allMembers.map((m) => ({
          id: `h1_${m.userId}`,
          data: () => buildHouseholdMember({
            householdId: 'h1',
            userId: m.userId,
            role: m.role,
          }) as unknown as Record<string, unknown>,
        })),
      });
    }
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
