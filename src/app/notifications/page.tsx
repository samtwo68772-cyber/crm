
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { getNotifications, markAsRead, markAllAsRead } from './actions';
import type { Notification } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Briefcase, ListTodo, Mail, Calendar, CheckCheck, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'case': return <Briefcase className="h-5 w-5 text-blue-500" />;
        case 'task': return <ListTodo className="h-5 w-5 text-green-500" />;
        case 'email': return <Mail className="h-5 w-5 text-orange-500" />;
        case 'meeting': return <Calendar className="h-5 w-5 text-purple-500" />;
        default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
};

const ITEMS_PER_PAGE = 15;

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const [currentPage, setCurrentPage] = useState(page);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
      const pageNum = parseInt(searchParams.get('page') || '1', 10);
      setCurrentPage(pageNum);
    }, [searchParams]);

    const { data: notificationsData = { notifications: [], total: 0 }, isLoading } = useQuery<{notifications: Notification[], total: number}>({
        queryKey: ['notifications', user?.id, currentPage, filter],
        queryFn: () => getNotifications(user!.id, { page: currentPage, limit: ITEMS_PER_PAGE, filter }),
        enabled: !!user,
        placeholderData: (previousData) => previousData,
    });

    const { notifications, total } = notificationsData;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    const markAsReadMutation = useMutation({
        mutationFn: markAsRead,
        onSuccess: (updatedNotification) => {
             queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        }
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => markAllAsRead(user!.id),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        }
    });

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            markAsReadMutation.mutate(notification.id);
        }
        router.push(notification.link);
    };
    
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        router.push(`/notifications?page=${newPage}`);
    }

    const PaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages > 0 ? totalPages : 1} ({total} total notifications)
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );

    if(isLoading && !notifications.length) return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-10 w-64" />
            </div>
            <Card>
                <CardContent className="p-0">
                    <div className="space-y-0">
                         {[...Array(5)].map((_, i) => (
                             <div key={i} className="flex items-start gap-4 p-4 border-b">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                     <Skeleton className="h-5 w-1/4" />
                                     <Skeleton className="h-4 w-3/4" />
                                     <Skeleton className="h-3 w-1/5" />
                                </div>
                             </div>
                         ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Notifications</h2>
                    <p className="text-muted-foreground">A complete history of your notifications.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Select value={filter} onValueChange={(v: 'all' | 'unread') => setFilter(v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter notifications" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Notifications</SelectItem>
                            <SelectItem value="unread">Unread Only</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => markAllAsReadMutation.mutate()} disabled={markAllAsReadMutation.isPending}>
                        <CheckCheck className="mr-2 h-4 w-4" /> Mark All as Read
                    </Button>
                </div>
            </div>
            
            <Card>
                <CardContent className="p-0">
                    <div className="space-y-0">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-4 p-4 border-b cursor-pointer transition-colors hover:bg-muted/50",
                                        !notification.read && "bg-primary/5 hover:bg-primary/10"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                                    <div className="flex-1">
                                        <p className={cn("font-semibold text-sm", !notification.read && "text-primary")}>{notification.title}</p>
                                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <EyeOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-semibold">All caught up!</p>
                                <p>There are no notifications matching your filter.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
                {totalPages > 1 && (
                     <CardContent className="p-4 border-t">
                        <PaginationControls />
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
