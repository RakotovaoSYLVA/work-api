// prisma/seed.ts
import { PrismaClient, TicketStatus, TicketPriority } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed démarrage...');

  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', label: 'Administrateur' },
  });
  const agentRole = await prisma.role.upsert({
    where: { name: 'agent' },
    update: {},
    create: { name: 'Agent', label: 'Agent de support' },
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'Utilisateur', label: 'Utilisateur' },
  });

  // Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@tickets.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@tickets.com',
      passwordHash: '$2b$10$ExampleHashForPassword123',
      roleId: adminRole.id,
    },
  });

  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@tickets.com' },
    update: {},
    create: {
      username: 'agent1',
      email: 'agent@tickets.com',
      passwordHash: '$2b$10$ExampleHashForPassword123',
      roleId: agentRole.id,
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: 'user@tickets.com' },
    update: {},
    create: {
      username: 'user1',
      email: 'user@tickets.com',
      passwordHash: '$2b$10$ExampleHashForPassword123',
      roleId: userRole.id,
    },
  });

  // Tickets (création avec create pour récupérer les IDs)
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Problème de connexion',
      description: 'Je ne peux pas me connecter à mon compte',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      createdBy: normalUser.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Demande de fonctionnalité',
      description: 'Ajouter l\'export des tickets',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.NORMAL,
      createdBy: normalUser.id,
      assignedTo: agentUser.id,
    },
  });

  // Assignation
  await prisma.ticketAssignment.create({
    data: {
      ticketId: ticket2.id,
      assignedBy: adminUser.id,
      assignedTo: agentUser.id,
    },
  });

  // Messages
  await prisma.message.create({
    data: {
      ticketId: ticket1.id,
      senderId: normalUser.id,
      content: 'Bonjour, je n\'arrive pas à me connecter depuis ce matin.',
    },
  });
  await prisma.message.create({
    data: {
      ticketId: ticket1.id,
      senderId: agentUser.id,
      content: 'Avez-vous essayé de réinitialiser votre mot de passe ?',
    },
  });

  // Logs
  await prisma.ticketLog.create({
    data: {
      ticketId: ticket2.id,
      action: 'ASSIGNED',
      userId: adminUser.id,
      details: { assignedTo: agentUser.username },
    },
  });
  await prisma.ticketLog.create({
    data: {
      ticketId: ticket2.id,
      action: 'STATUS_CHANGED',
      userId: agentUser.id,
      details: { from: 'OPEN', to: 'IN_PROGRESS' },
    },
  });

  console.log('✅ Seed terminé');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
