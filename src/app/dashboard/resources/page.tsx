
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useResources } from '@/hooks/use-admin';
import { PremiumResources } from '@/components/resources/premium-resources';
import { Separator } from '@/components/ui/separator';
import { JeeResources } from '@/components/resources/jee-resources';
import { Class12Resources } from '@/components/resources/class12-resources';

export default function ResourcesPage() {
    const { resources, loading } = useResources();

    if(loading) {
        return (
             <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
                    <p className="text-muted-foreground">Helpful documents and links to aid your studies.</p>
                </div>
                 <div className="h-24 bg-muted rounded-lg animate-pulse" />
                 <div className="h-24 bg-muted rounded-lg animate-pulse mt-4" />
                 <div className="h-24 bg-muted rounded-lg animate-pulse mt-4" />
                 <Separator/>
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                     {Array.from({ length: 3 }).map((_, i) => (
                         <Card key={i}>
                             <CardHeader>
                                 <CardTitle className="h-6 bg-muted rounded-md animate-pulse"></CardTitle>
                                 <CardDescription className="h-4 bg-muted rounded-md animate-pulse mt-2"></CardDescription>
                             </CardHeader>
                             <CardContent>
                                 <div className="h-10 bg-muted rounded-md animate-pulse"></div>
                             </CardContent>
                         </Card>
                     ))}
                 </div>
             </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
                <p className="text-muted-foreground">Helpful documents and links to aid your studies.</p>
            </div>

            <div className="space-y-4">
              <PremiumResources />
              <JeeResources />
              <Class12Resources />
            </div>


            <Separator />
            
            <div>
                 <h2 className="text-2xl font-bold tracking-tight">General Resources</h2>
                <p className="text-muted-foreground">Free resources available for all students.</p>
            </div>


            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {resources.map(resource => (
                    <Card key={resource.id}>
                        <CardHeader>
                            <CardTitle>{resource.title}</CardTitle>
                            <CardDescription>{resource.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download / View
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                 {resources.length === 0 && (
                    <p className="text-muted-foreground col-span-3 text-center">No general resources have been added yet.</p>
                )}
            </div>
        </div>
    );
}

    