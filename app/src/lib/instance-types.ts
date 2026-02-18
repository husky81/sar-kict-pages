export const INSTANCE_PRESETS: Record<
  string,
  { label: string; volumeSize: number; hourlyPrice: number; ebsMonthlyPerGb: number }
> = {
  "t3.small": { label: "테스트서버", volumeSize: 30, hourlyPrice: 0.0208, ebsMonthlyPerGb: 0.08 },
  "r6i.4xlarge": { label: "SAR서버", volumeSize: 500, hourlyPrice: 1.008, ebsMonthlyPerGb: 0.08 },
};

export const INSTANCE_TYPE_OPTIONS = Object.entries(INSTANCE_PRESETS).map(
  ([type, { label }]) => ({ value: type, label: `${label} (${type})` })
);

export function getPreset(instanceType: string) {
  return INSTANCE_PRESETS[instanceType] ?? INSTANCE_PRESETS["t3.small"];
}
