'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCheck, Trash2, Loader2, Bell } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { NotificationItem } from './notification-item'
import { NotificationFilters } from './notification-filters'
import {
  useGetNotificationsQuery,
  useReadAllNotificationsMutation,
  useDeleteAllNotificationsMutation,
  useReadNotificationMutation,
  useDeleteNotificationMutation,
} from '@/store/api/notification/notificationApi'
import { toast } from 'sonner'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import type { NotificationType } from '@/store/api/notification/types'
import { PageHeader } from '@/components/dashboard/page-header'

export function NotificationsPageContent() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all')

  const { data, isLoading, error } = useGetNotificationsQuery(
    {
      page,
      page_size: pageSize,
      type: typeFilter === 'all' ? undefined : typeFilter,
      read: readFilter === 'all' ? undefined : readFilter === 'read',
    },
    {
      pollingInterval: 300000, // 5 minutes
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  )

  const [readAll, { isLoading: isReadingAll }] =
    useReadAllNotificationsMutation()
  const [deleteAll, { isLoading: isDeletingAll }] =
    useDeleteAllNotificationsMutation()
  const [readNotification] = useReadNotificationMutation()
  const [deleteNotification] = useDeleteNotificationMutation()

  const notifications = data?.data || []
  const pagination = data?.meta_data
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleRead = async (id: number) => {
    try {
      await readNotification({ notification_id: id }).unwrap()
      toast.success('Notification marked as read')
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification({ notification_id: id }).unwrap()
      toast.success('Notification deleted')
    } catch {
      toast.error('Failed to delete notification')
    }
  }

  const handleReadAll = async () => {
    try {
      await readAll().unwrap()
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAll().unwrap()
      toast.success('All notifications deleted')
    } catch {
      toast.error('Failed to delete all notifications')
    }
  }

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-10 w-64' />
        </div>
        <div className='space-y-3'>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className='h-32 w-full' />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <Bell className='h-12 w-12 text-muted-foreground mb-4' />
        <h3 className='text-lg font-semibold mb-2'>
          Failed to load notifications
        </h3>
        <p className='text-sm text-muted-foreground'>
          Please try refreshing the page
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <PageHeader
          title='Notifications'
          subtitle={`${notifications.length} notification${
            notifications.length !== 1 ? 's' : ''
          }`}
          showBackButton={true}
        />
        {notifications.length > 0 && (
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={handleReadAll}
              disabled={isReadingAll || unreadCount === 0}
            >
              {isReadingAll ? (
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
              ) : (
                <CheckCheck className='h-4 w-4 mr-2' />
              )}
              Mark all read
            </Button>
            <Button
              variant='outline'
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className='text-destructive hover:text-destructive'
            >
              {isDeletingAll ? (
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
              ) : (
                <Trash2 className='h-4 w-4 mr-2' />
              )}
              Delete all
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <NotificationFilters
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        readFilter={readFilter}
        onReadFilterChange={setReadFilter}
      />

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16 text-center'>
          <Bell className='h-12 w-12 text-muted-foreground mb-4' />
          <h3 className='text-lg font-semibold mb-2'>No notifications</h3>
          <p className='text-sm text-muted-foreground'>
            You&apos;re all caught up! There are no notifications to display.
          </p>
        </div>
      ) : (
        <>
          <div className='space-y-3'>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.notification_id}
                notification={notification}
                onRead={handleRead}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className='flex items-center justify-between'>
              <div className='text-sm text-muted-foreground'>
                Page {page} of {pagination.pages} ({pagination.items} total)
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={
                        page === 1
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: Math.min(5, pagination.pages) },
                    (_, i) => {
                      let pageNum: number
                      if (pagination.pages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                            className='cursor-pointer'
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    }
                  )}
                  {pagination.pages > 5 && page < pagination.pages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(pagination.pages, p + 1))
                      }
                      className={
                        page === pagination.pages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </>
  )
}
