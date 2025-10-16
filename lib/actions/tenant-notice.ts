"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NoticeType, NoticeStatus } from "@prisma/client";

export async function getTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        status: "ACTIVE"
      },
      select: {
        id: true,
        bpCode: true,
        firstName: true,
        lastName: true,
        company: true,
        businessName: true,
      },
      orderBy: {
        businessName: "asc"
      }
    });

    return tenants;
  } catch (error) {
    console.error("Error fetching tenants:", error);
    throw new Error("Failed to fetch tenants");
  }
}

interface CreateNoticeItem {
  description: string;
  status: string;
  amount: number;
  months?: string;
}

interface CreateNoticeData {
  tenantId: string;
  noticeType: string;
  items: CreateNoticeItem[];
  forYear: number;
  primarySignatory: string;
  primaryTitle: string;
  primaryContact: string;
  secondarySignatory: string;
  secondaryTitle: string;
}

export async function createTenantNotice(data: CreateNoticeData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Get the next notice number for this tenant
    const existingNotices = await prisma.tenantNotice.findMany({
      where: {
        tenantId: data.tenantId,
        isSettled: false
      },
      orderBy: {
        noticeNumber: "desc"
      }
    });

    let noticeNumber = 1;
    if (existingNotices.length > 0) {
      const lastNotice = existingNotices[0];
      noticeNumber = lastNotice.noticeNumber + 1;
      
      // Cap at 3 (Final Notice)
      if (noticeNumber > 3) {
        noticeNumber = 3;
      }
    }

    // Auto-determine notice type based on number
    let noticeType = data.noticeType;
    if (noticeNumber === 1) noticeType = "FIRST_NOTICE";
    else if (noticeNumber === 2) noticeType = "SECOND_NOTICE";
    else if (noticeNumber >= 3) noticeType = "FINAL_NOTICE";

    // Calculate total amount
    const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

    const notice = await prisma.tenantNotice.create({
      data: {
        tenantId: data.tenantId,
        noticeType: noticeType as NoticeType,
        noticeNumber,
        totalAmount,
        forMonth: data.items[0]?.months || new Date().toLocaleString('default', { month: 'long' }),
        forYear: data.forYear,
        primarySignatory: data.primarySignatory,
        primaryTitle: data.primaryTitle,
        primaryContact: data.primaryContact,
        secondarySignatory: data.secondarySignatory,
        secondaryTitle: data.secondaryTitle,
        createdById: session.user.id,
        items: {
          create: data.items.map(item => {
            // For custom status, we need to extract the actual custom text
            const validStatuses: NoticeStatus[] = ['PAST_DUE', 'OVERDUE', 'CRITICAL', 'PENDING', 'UNPAID', 'CUSTOM'];
            const isCustom = typeof item.status === 'string' && !validStatuses.includes(item.status as NoticeStatus);
            
            return {
              description: item.description,
              status: isCustom ? NoticeStatus.CUSTOM : item.status as NoticeStatus,
              customStatus: isCustom ? item.status : null,
              amount: item.amount,
              months: item.months || new Date().toLocaleString('default', { month: 'long' }),
            };
          })
        }
      },
      include: {
        tenant: {
          select: {
            businessName: true,
            bpCode: true
          }
        },
        items: true
      }
    });

    revalidatePath("/dashboard/tenant-notice");
    return notice;
  } catch (error) {
    console.error("Error creating tenant notice:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to create tenant notice: ${error.message}`);
    }
    throw new Error("Failed to create tenant notice");
  }
}

export async function getTenantNotices(filters?: {
  tenantId?: string;
  status?: string;
  isSettled?: boolean;
}) {
  try {
    const notices = await prisma.tenantNotice.findMany({
      where: {
        ...(filters?.tenantId && { tenantId: filters.tenantId }),
        ...(filters?.isSettled !== undefined && { isSettled: filters.isSettled }),
        // Filter by status through the items relation
        ...(filters?.status && {
          items: {
            some: {
              status: filters.status as NoticeStatus
            }
          }
        }),
      },
      include: {
        tenant: {
          select: {
            id: true,
            bpCode: true,
            businessName: true,
            company: true,
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        items: true
      },
      orderBy: [
        { isSettled: "asc" },
        { dateIssued: "desc" }
      ]
    });

    return notices;
  } catch (error) {
    console.error("Error fetching tenant notices:", error);
    throw new Error("Failed to fetch tenant notices");
  }
}

export async function getTenantNoticeById(id: string) {
  try {
    const notice = await prisma.tenantNotice.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            bpCode: true,
            businessName: true,
            company: true,
            firstName: true,
            lastName: true,
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        items: true
      }
    });

    return notice;
  } catch (error) {
    console.error("Error fetching tenant notice:", error);
    throw new Error("Failed to fetch tenant notice");
  }
}

export async function settleNotice(noticeId: string, settledBy: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const notice = await prisma.tenantNotice.update({
      where: { id: noticeId },
      data: {
        isSettled: true,
        settledDate: new Date(),
        settledBy: settledBy,
      }
    });

    // Reset notice count for tenant (delete unsettled notices)
    await prisma.tenantNotice.deleteMany({
      where: {
        tenantId: notice.tenantId,
        isSettled: false,
        id: { not: noticeId }
      }
    });

    revalidatePath("/dashboard/tenant-notice");
    return notice;
  } catch (error) {
    console.error("Error settling notice:", error);
    throw new Error("Failed to settle notice");
  }
}

export async function getTenantNoticeCount(tenantId: string) {
  try {
    const count = await prisma.tenantNotice.count({
      where: {
        tenantId,
        isSettled: false
      }
    });

    return count;
  } catch (error) {
    console.error("Error getting tenant notice count:", error);
    return 0;
  }
}

interface UpdateNoticeItem {
  id?: string;
  description: string;
  status: string;
  amount: number;
  months?: string;
  year?: number;
}

interface UpdateNoticeData {
  items: UpdateNoticeItem[];
  primarySignatory: string;
  primaryTitle: string;
  primaryContact: string;
  secondarySignatory: string;
  secondaryTitle: string;
}

export async function updateTenantNotice(noticeId: string, data: UpdateNoticeData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Calculate total amount
    const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

    // Get the year from the first item (assuming all items have the same year)
    const forYear = data.items[0]?.year || new Date().getFullYear();

    // First, update the notice itself
    await prisma.tenantNotice.update({
      where: { id: noticeId },
      data: {
        totalAmount,
        forYear, // Update the year at the notice level
        primarySignatory: data.primarySignatory,
        primaryTitle: data.primaryTitle,
        primaryContact: data.primaryContact,
        secondarySignatory: data.secondarySignatory,
        secondaryTitle: data.secondaryTitle,
      }
    });

    // Get existing items to determine which to update, create, or delete
    const existingItems = await prisma.noticeItem.findMany({
      where: { noticeId: noticeId }
    });

    const existingItemIds = existingItems.map((item) => item.id);
    const incomingItemIds = data.items.filter((item) => item.id).map((item) => item.id!);
    
    // Delete items that are no longer present
    const itemsToDelete = existingItemIds.filter((id) => !incomingItemIds.includes(id));
    if (itemsToDelete.length > 0) {
      await prisma.noticeItem.deleteMany({
        where: {
          id: { in: itemsToDelete }
        }
      });
    }

    // Process each item individually
    for (const item of data.items) {
      const validStatuses: NoticeStatus[] = ['PAST_DUE', 'OVERDUE', 'CRITICAL', 'PENDING', 'UNPAID', 'CUSTOM'];
      const isCustom = typeof item.status === 'string' && !validStatuses.includes(item.status as NoticeStatus);
      
      const itemData = {
        description: item.description,
        status: isCustom ? NoticeStatus.CUSTOM : item.status as NoticeStatus,
        customStatus: isCustom ? item.status : null,
        amount: item.amount,
        months: item.months ? `${item.months} ${item.year || new Date().getFullYear()}` : `${new Date().toLocaleString('default', { month: 'long' })} ${item.year || new Date().getFullYear()}`,
      };

      if (item.id && existingItemIds.includes(item.id)) {
        // Update existing item
        await prisma.noticeItem.update({
          where: { id: item.id },
          data: itemData
        });
      } else {
        // Create new item
        await prisma.noticeItem.create({
          data: {
            ...itemData,
            noticeId: noticeId
          }
        });
      }
    }

    // Fetch the updated notice with all items
    const notice = await prisma.tenantNotice.findUnique({
      where: { id: noticeId },
      include: {
        tenant: {
          select: {
            businessName: true,
            bpCode: true
          }
        },
        items: true
      }
    });

    if (!notice) {
      throw new Error("Notice not found after update");
    }

    revalidatePath("/dashboard/tenant-notice");
    revalidatePath(`/notices/${noticeId}`);
    return notice;
  } catch (error) {
    console.error("Error updating tenant notice:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to update tenant notice: ${error.message}`);
    }
    throw new Error("Failed to update tenant notice");
  }
}

export async function deleteNotice(noticeId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    await prisma.tenantNotice.delete({
      where: { id: noticeId }
    });

    revalidatePath("/dashboard/tenant-notice");
  } catch (error) {
    console.error("Error deleting notice:", error);
    throw new Error("Failed to delete notice");
  }
}