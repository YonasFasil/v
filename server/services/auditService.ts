import { db } from '../db';
import { auditLogs, type InsertAuditLog } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';

export class AuditService {
  static async log(data: {
    tenantId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
  }) {
    try {
      const auditData: InsertAuditLog = {
        tenantId: data.tenantId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes,
        metadata: data.metadata,
      };

      await db.insert(auditLogs).values(auditData);
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  static async logCreate(tenantId: string, userId: string, entityType: string, entityId: string, data: any) {
    await this.log({
      tenantId,
      userId,
      action: 'CREATE',
      entityType,
      entityId,
      changes: { created: data },
    });
  }

  static async logUpdate(tenantId: string, userId: string, entityType: string, entityId: string, oldData: any, newData: any) {
    await this.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entityType,
      entityId,
      changes: { before: oldData, after: newData },
    });
  }

  static async logDelete(tenantId: string, userId: string, entityType: string, entityId: string, data: any) {
    await this.log({
      tenantId,
      userId,
      action: 'DELETE',
      entityType,
      entityId,
      changes: { deleted: data },
    });
  }

  static async getAuditLogs(tenantId: string, options: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { entityType, entityId, userId, action, limit = 50, offset = 0 } = options;

    let conditions = [eq(auditLogs.tenantId, tenantId)];

    if (entityType) {
      conditions.push(eq(auditLogs.entityType, entityType));
    }
    if (entityId) {
      conditions.push(eq(auditLogs.entityId, entityId));
    }
    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }
    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    return await db
      .select()
      .from(auditLogs)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }
}