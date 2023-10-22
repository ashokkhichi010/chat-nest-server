export class CreateLogDto {
  uri: string;
  headers: Record<string, string>;
  ipAddress: string;
  method: string;
  body: Record<string, string>;
  query: Record<string, string>;
  params: Record<string, string>;
  startTime: Date | string;
  endTime: Date | string;
  rtime: number;
  status: number;
  response: object;
}
