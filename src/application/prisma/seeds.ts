// prisma/seed.ts
import { PrismaClient, TicketStatus, TicketPriority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding du système de tickets...');

  const roles = await prisma.role.createMany({
    data: [
      { name: 'admin', label: 'Administrateur' },
      { name: 'agent', label: 'Agent de support' },
      { name: 'user', label: 'Utilisateur' },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ ${roles.count} rôles créés`);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@tickets.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@tickets.com',
      passwordHash: '$2b$10$ExampleHashForPassword123', 
      roleId: 1, 
    },
  });

  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@tickets.com' },
    update: {},
    create: {
      username: 'agent1',
      email: 'agent@tickets.com',
      passwordHash: '$2b$10$ExampleHashForPassword123',
      roleId: 2, 
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: 'user@tickets.com' },
    update: {},
    create: {
      username: 'user1',
      email: 'user@tickets.com',
      passwordHash: '$2b$10$ExampleHashForPassword123',
      roleId: 3, 
    },
  });

  console.log('✅ Utilisateurs de test créés');

  const tickets = await prisma.ticket.createMany({
    data: [
      {
        title: 'Problème de connexion',
        description: 'Je ne peux pas me connecter à mon compte',
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
        createdBy: normalUser.id,
      },
      {
        title: 'Demande de fonctionnalité',
        description: 'Ajouter la possibilité d\'exporter les tickets',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.NORMAL,
        createdBy: normalUser.id,
        assignedTo: agentUser.id,
      },
      {
        title: 'Bug critique',
        description: 'L\'application crash lors de l\'ouverture du dashboard',
        status: TicketStatus.OPEN,
        priority: TicketPriority.URGENT,
        createdBy: adminUser.id,
      },
    ],
  });

  console.log(`✅ ${tickets.count} tickets créés`);

  const assignment = await prisma.ticketAssignment.create({
    data: {
      ticketId: 2, 
      assignedBy: adminUser.id,
      assignedTo: agentUser.id,
    },
  });

  console.log('✅ Assignation de ticket créée');

  const messages = await prisma.message.createMany({
    data: [
      {
        ticketId: 1,
        senderId: normalUser.id,
        content: 'Bonjour, je n\'arrive pas à me connecter depuis ce matin.',
      },
      {
        ticketId: 1,
        senderId: agentUser.id,
        content: 'Avez-vous essayé de réinitialiser votre mot de passe ?',
      },
    ],
  });

  console.log(`✅ ${messages.count} messages créés`);

  const logs = await prisma.ticketLog.createMany({
    data: [
      {
        ticketId: 2,
        action: 'ASSIGNED',
        userId: adminUser.id,
        details: { assignedTo: agentUser.username },
      },
      {
        ticketId: 2,
        action: 'STATUS_CHANGED',
        userId: agentUser.id,
        details: { from: 'OPEN', to: 'IN_PROGRESS' },
      },
    ],
  });

  console.log(`✅ ${logs.count} logs créés`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });