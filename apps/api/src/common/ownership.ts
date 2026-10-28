import { InternalServerErrorException } from "@nestjs/common";

export interface Ownership {
  userId: string | null;
  groupId: string | null;
}

// Dono único (XOR): todo registro que pode ser pessoal OU de grupo tem
// exatamente um dos dois preenchido. O Prisma não expressa isso — a
// migration tem uma CHECK constraint por tabela, e esta função barra o
// erro antes de chegar no banco (com mensagem melhor que um P2010).
// É erro de programação (o service montou o dono errado), não de input
// do usuário, por isso 500 e não 400.
export function assertSingleOwner(owner: Ownership): Ownership {
  if ((owner.userId === null) === (owner.groupId === null)) {
    throw new InternalServerErrorException("Registro precisa ter exatamente um dono (userId XOR groupId)");
  }
  return owner;
}

export function ownerFor(userId: string, groupId: string | undefined): Ownership {
  return assertSingleOwner(groupId ? { userId: null, groupId } : { userId, groupId: null });
}
