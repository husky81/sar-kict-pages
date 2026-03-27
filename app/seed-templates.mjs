import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking InstanceTemplate table...');

  try {
    const templates = await prisma.instanceTemplate.findMany();
    console.log(`Found ${templates.length} existing templates`);

    if (templates.length === 0) {
      console.log('Creating default templates...');

      await prisma.instanceTemplate.createMany({
        data: [
          {
            name: '기본 서버',
            description: 'CPU 최적화 기본 서버',
            instanceType: 't3.small',
            volumeSize: 200,
            isActive: true,
            isDefault: true,
            maxInstances: 2,
          },
          {
            name: '고성능 서버',
            description: '대용량 메모리 서버 (128GB)',
            instanceType: 'r6i.4xlarge',
            volumeSize: 500,
            isActive: true,
            isDefault: false,
            maxInstances: 1,
          },
          {
            name: 'GPU 서버',
            description: 'NVIDIA A10G GPU 서버',
            instanceType: 'g5.xlarge',
            volumeSize: 500,
            isActive: true,
            isDefault: false,
            maxInstances: 1,
          },
        ],
      });

      console.log('✅ Templates created successfully!');
    } else {
      console.log('Templates already exist, skipping creation.');
    }

    const allTemplates = await prisma.instanceTemplate.findMany();
    console.log('\nCurrent templates:');
    allTemplates.forEach(t => {
      console.log(`- ${t.name} (${t.instanceType}) - ${t.isActive ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 'P2021') {
      console.error('\n❌ Table "InstanceTemplate" does not exist.');
      console.error('You need to run the migration SQL first.');
      console.error('File: /tmp/quick_migration.sql');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
