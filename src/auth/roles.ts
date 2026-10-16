export const appRoles = ['owner', 'teacher', 'parent'] as const;

export type AppRole = (typeof appRoles)[number];

export type ActorIdentity = Readonly<{
  userId: string;
  roles: readonly AppRole[];
}>;

export type Profile = Readonly<{
  id: string;
  displayName: string;
}>;
