import { EC2Client, DescribeInstancesCommand, TerminateInstancesCommand, DescribeSecurityGroupsCommand, DeleteSecurityGroupCommand, DescribeKeyPairsCommand, DeleteKeyPairCommand } from '@aws-sdk/client-ec2';
import { IAMClient, CreateServiceLinkedRoleCommand } from '@aws-sdk/client-iam';

const region = process.env.AWS_REGION || 'ap-northeast-2';

const ec2 = new EC2Client({ region });
const iam = new IAMClient({ region });

// 1. Create service-linked role for CloudWatch Events
try {
  await iam.send(new CreateServiceLinkedRoleCommand({ AWSServiceName: 'events.amazonaws.com' }));
  console.log('Created CloudWatch Events service-linked role');
} catch (e) {
  if (e.message?.includes('already exists')) {
    console.log('CloudWatch Events service-linked role already exists');
  } else {
    console.log('Service-linked role error:', e.name, e.message);
  }
}

// 2. Find orphaned instances
const result = await ec2.send(new DescribeInstancesCommand({
  Filters: [{ Name: 'tag:ManagedBy', Values: ['sar-kict-app'] }]
}));

for (const reservation of result.Reservations || []) {
  for (const inst of reservation.Instances || []) {
    const state = inst.State?.Name;
    const id = inst.InstanceId;
    const name = inst.Tags?.find(t => t.Key === 'Name')?.Value;
    const keyName = inst.KeyName;
    const sgIds = inst.SecurityGroups?.map(sg => sg.GroupId) || [];
    console.log(`Found: ${id} (${state}) - ${name}, key: ${keyName}, SGs: ${sgIds.join(',')}`);

    if (state !== 'terminated') {
      console.log(`  Terminating ${id}...`);
      await ec2.send(new TerminateInstancesCommand({ InstanceIds: [id] }));
      console.log(`  Terminated.`);
    }
  }
}

// 3. Find orphaned SGs
const sgResult = await ec2.send(new DescribeSecurityGroupsCommand({
  Filters: [{ Name: 'group-name', Values: ['sar-kict-user-*'] }]
}));
for (const sg of sgResult.SecurityGroups || []) {
  console.log(`Found SG: ${sg.GroupId} (${sg.GroupName})`);
  try {
    await ec2.send(new DeleteSecurityGroupCommand({ GroupId: sg.GroupId }));
    console.log(`  Deleted SG ${sg.GroupId}`);
  } catch (e) {
    console.log(`  SG delete deferred: ${e.message}`);
  }
}

// 4. Find orphaned key pairs
const kpResult = await ec2.send(new DescribeKeyPairsCommand({
  Filters: [{ Name: 'key-name', Values: ['sar-kict-user-*'] }]
}));
for (const kp of kpResult.KeyPairs || []) {
  console.log(`Found KeyPair: ${kp.KeyName}`);
  await ec2.send(new DeleteKeyPairCommand({ KeyName: kp.KeyName }));
  console.log(`  Deleted KeyPair ${kp.KeyName}`);
}

console.log('Done.');
