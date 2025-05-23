import * as ip from 'ip';

export const ipRange = (ipToCheck: string, ipStart: string, ipEnd: string) => {
  try {
    return (
      ip.toLong(ipToCheck) >= ip.toLong(ipStart) &&
      ip.toLong(ipToCheck) <= ip.toLong(ipEnd)
    );
  } catch {
    return false;
  }
};
