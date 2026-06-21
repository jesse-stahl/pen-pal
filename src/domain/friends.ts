export function friendRequestId(a: string, b: string): string {
  return [a, b].sort().join('_');
}

export function isIncoming(req: { from: string; to: string }, viewerUid: string): boolean {
  return req.to === viewerUid;
}
