import { z } from "zod";
import type { Profile } from "./auth";

// Espelham os enums do schema.prisma em texto puro, pra web e mobile
// não dependerem do Prisma Client.
export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";
export type InviteStatus = "PENDENTE" | "ACEITO" | "RECUSADO" | "EXPIRADO";

export const createGroupSchema = z.object({
  name: z.string().trim().min(1),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z.object({
  name: z.string().trim().min(1),
});
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

// OWNER nunca é um valor aceito aqui — só existe um por grupo, fixado
// na criação, e não muda de mãos por essa rota nem pelo convite.
export const groupInviteRoleSchema = z.enum(["ADMIN", "MEMBER"]);
export type GroupInviteRole = z.infer<typeof groupInviteRoleSchema>;

export const createInviteSchema = z.object({
  email: z.string().email(),
  role: groupInviteRoleSchema.default("MEMBER"),
});
export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export const updateMemberRoleSchema = z.object({
  role: groupInviteRoleSchema,
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string; // ISO date
  user?: Profile;
}

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string; // ISO date
  members: GroupMember[];
}

export interface GroupInvite {
  id: string;
  groupId: string;
  email: string;
  invitedBy: string | null;
  token: string;
  role: GroupInviteRole;
  status: InviteStatus;
  expiresAt: string; // ISO date
  createdAt: string; // ISO date
  group?: Group;
}
