
'use client';

import { useUsers } from '@/hooks/use-admin';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import {Crown} from 'lucide-react';

const LEADERBOARD_EXCLUDED_UIDS = ['23j2N4p0ZgUnCqTBrrppkYtD2fI3'];

export default function LeaderboardPage() {
    const { user: currentUser } = useAuth();
    const { users } = useUsers();

    const sortedUsers = [...users]
        .filter(u => !u.isBlocked && !LEADERBOARD_EXCLUDED_UIDS.includes(u.uid))
        .sort((a, b) => b.credits - a.credits);

    const topThree = sortedUsers.slice(0, 3);
    const restOfUsers = sortedUsers.slice(3);

    const currentUserRank = sortedUsers.findIndex(u => u.uid === currentUser?.uid);

    const getTrophyColor = (rank: number) => {
        if (rank === 0) return 'text-yellow-500';
        if (rank === 1) return 'text-slate-400';
        if (rank === 2) return 'text-amber-700';
        return 'text-muted-foreground';
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Top Achievers</h1>
                <p className="text-muted-foreground">See who's leading the board with the most credits!</p>
            </div>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 2nd Place */}
                <div className="md:mt-8">
                {topThree.length > 1 && (
                    <Card className="relative text-center border-slate-400 border-2 shadow-lg shadow-slate-500/10">
                        <CardHeader>
                             <Trophy className={cn("h-8 w-8 mx-auto", getTrophyColor(1))} />
                            <Avatar className="w-24 h-24 mx-auto mt-2 border-4 border-slate-400">
                                <AvatarImage src={topThree[1].photoURL || `https://picsum.photos/150/150?u=${topThree[1].uid}`} />
                                <AvatarFallback>{topThree[1].displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="mt-4">{topThree[1].displayName}</CardTitle>
                            <CardDescription>2nd Place</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-400">{topThree[1].credits} Credits</div>
                        </CardContent>
                    </Card>
                )}
                </div>

                {/* 1st Place */}
                <div>
                {topThree.length > 0 && (
                    <Card className="relative text-center border-yellow-500 border-2 shadow-2xl shadow-yellow-500/20">
                         <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-white p-2 rounded-full">
                            <Crown className="h-6 w-6" />
                        </div>
                        <CardHeader>
                             <Trophy className={cn("h-10 w-10 mx-auto text-yellow-500", getTrophyColor(0))} />
                            <Avatar className="w-32 h-32 mx-auto mt-2 border-4 border-yellow-500">
                                <AvatarImage src={topThree[0].photoURL || `https://picsum.photos/150/150?u=${topThree[0].uid}`} />
                                <AvatarFallback>{topThree[0].displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="mt-4 text-2xl">{topThree[0].displayName}</CardTitle>
                            <CardDescription>1st Place</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-yellow-500">{topThree[0].credits} Credits</div>
                        </CardContent>
                    </Card>
                )}
                </div>
                
                {/* 3rd Place */}
                 <div className="md:mt-8">
                {topThree.length > 2 && (
                    <Card className="relative text-center border-amber-700 border-2 shadow-lg shadow-amber-800/10">
                        <CardHeader>
                             <Trophy className={cn("h-8 w-8 mx-auto", getTrophyColor(2))} />
                            <Avatar className="w-24 h-24 mx-auto mt-2 border-4 border-amber-700">
                                <AvatarImage src={topThree[2].photoURL || `https://picsum.photos/150/150?u=${topThree[2].uid}`} />
                                <AvatarFallback>{topThree[2].displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="mt-4">{topThree[2].displayName}</CardTitle>
                            <CardDescription>3rd Place</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-700">{topThree[2].credits} Credits</div>
                        </CardContent>
                    </Card>
                )}
                </div>
            </div>

            {/* Rest of the Leaderboard */}
            <Card>
                <CardHeader>
                    <CardTitle>Full Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Rank</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="text-right">Credits</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {restOfUsers.map((user, index) => {
                                const rank = index + 4;
                                return (
                                    <TableRow key={user.uid} className={cn(currentUser?.uid === user.uid && 'bg-primary/10')}>
                                        <TableCell className="font-bold text-lg text-muted-foreground">{rank}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10 border">
                                                    <AvatarImage src={user.photoURL || `https://picsum.photos/150/150?u=${user.uid}`} />
                                                    <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{user.displayName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-lg">{user.credits}</TableCell>
                                    </TableRow>
                                )
                            })}
                             {sortedUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No users to rank yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             {currentUserRank !== -1 && (
                <Card className="sticky bottom-20 md:bottom-4 bg-background/80 backdrop-blur-lg border-primary shadow-lg">
                    <CardContent className="p-4 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-md p-2 w-20">
                                <span className="text-xs font-bold">YOUR RANK</span>
                                <span className="text-3xl font-bold">{currentUserRank + 1}</span>
                            </div>
                            <h3 className="text-lg font-semibold">You are on the leaderboard! Keep it up!</h3>
                         </div>
                         <div className="text-right">
                             <p className="text-sm text-muted-foreground">Your Credits</p>
                             <p className="text-2xl font-bold">{sortedUsers[currentUserRank].credits}</p>
                         </div>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
