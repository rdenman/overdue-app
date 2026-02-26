import { queryKeys } from '@/lib/hooks/query-keys';

describe('queryKeys', () => {
  describe('households', () => {
    it('all() includes userId', () => {
      expect(queryKeys.households.all('u1')).toEqual(['households', 'u1']);
    });

    it('detail() includes household id', () => {
      expect(queryKeys.households.detail('h1')).toEqual(['households', 'detail', 'h1']);
    });

    it('members() includes household id', () => {
      expect(queryKeys.households.members('h1')).toEqual(['households', 'members', 'h1']);
    });

    it('member() includes both household and user ids', () => {
      expect(queryKeys.households.member('h1', 'u1')).toEqual([
        'households', 'member', 'h1', 'u1',
      ]);
    });
  });

  describe('rooms', () => {
    it('household() includes householdId', () => {
      expect(queryKeys.rooms.household('h1')).toEqual(['rooms', 'household', 'h1']);
    });

    it('detail() includes householdId and roomId', () => {
      expect(queryKeys.rooms.detail('h1', 'r1')).toEqual(['rooms', 'detail', 'h1', 'r1']);
    });
  });

  describe('chores', () => {
    it('household() includes householdId', () => {
      expect(queryKeys.chores.household('h1')).toEqual(['chores', 'household', 'h1']);
    });

    it('detail() includes choreId', () => {
      expect(queryKeys.chores.detail('c1')).toEqual(['chores', 'detail', 'c1']);
    });

    it('today() includes userId', () => {
      expect(queryKeys.chores.today('u1')).toEqual(['chores', 'today', 'u1']);
    });

    it('allHouseholds() includes userId', () => {
      expect(queryKeys.chores.allHouseholds('u1')).toEqual(['chores', 'allHouseholds', 'u1']);
    });
  });

  describe('invites', () => {
    it('pending() includes email', () => {
      expect(queryKeys.invites.pending('a@b.com')).toEqual(['invites', 'pending', 'a@b.com']);
    });

    it('forHousehold() includes householdId', () => {
      expect(queryKeys.invites.forHousehold('h1')).toEqual(['invites', 'household', 'h1']);
    });
  });

  describe('users', () => {
    it('profile() includes uid', () => {
      expect(queryKeys.users.profile('u1')).toEqual(['users', 'u1']);
    });
  });
});
