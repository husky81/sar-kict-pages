import { EC2Client } from "@aws-sdk/client-ec2";
import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";

const globalForAws = globalThis as unknown as {
  ec2: EC2Client | undefined;
  cloudwatch: CloudWatchClient | undefined;
};

const config = {
  region: process.env.AWS_REGION || "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
};

export const ec2 = globalForAws.ec2 ?? new EC2Client(config);
export const cloudwatch =
  globalForAws.cloudwatch ?? new CloudWatchClient(config);

if (process.env.NODE_ENV !== "production") {
  globalForAws.ec2 = ec2;
  globalForAws.cloudwatch = cloudwatch;
}
