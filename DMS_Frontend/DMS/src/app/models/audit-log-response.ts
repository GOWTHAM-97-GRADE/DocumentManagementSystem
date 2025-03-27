export interface AuditLogResponse {
    id: number;
    timestamp: string;
    userId: number;
    username: string;
    operation: string;
    entityType: string;
    entityId: string;
    details: string;
  }