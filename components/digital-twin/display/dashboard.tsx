"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DigitalTwinCard from '@/components/digital-twin/display/digital-twin-card';
import { useQueryState, parseAsString } from 'nuqs';
import { getUserSupplyChains, deleteSupplyChainViaEdgeFunction } from '@/lib/api/supply-chain';
import { useUser } from '@/lib/stores/user';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Trash2 } from 'lucide-react';
import { RefreshCWIcon, PlusIcon } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface SupplyChainData {
  supply_chain_id: string;
  name: string;
  description: string;
  organisation: {
    industry: string;
    location: string;
  };
  form_data: {
    risks: string[];
    industry: string;
  };
  timestamp: string;
  nodes: any[];
  edges: any[];
}

interface ApiResponse {
  status: string;
  data: SupplyChainData[];
  meta: {
    total_supply_chains: number;
    total_nodes: number;
    total_edges: number;
  };
}

// Glassmorphic Card Component
function GlassmorphicCard({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) {
  return (
    <Card 
      className={`border border-white/30 dark:border-slate-700/10 bg-white/70 dark:bg-slate-900/5 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 rounded-xl ${className}`} 
      {...props}
    >
      {children}
    </Card>
  )
}

export default function DigitalTwinDashboard() {
  const [supplyChains, setSupplyChains] = useState<SupplyChainData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplyChainToDelete, setSupplyChainToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [view, setView] = useQueryState('view', parseAsString);
  const { userData, userLoading } = useUser();

  const fetchSupplyChains = async () => {
    if (!userData?.id) {
      setError('User not found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response: ApiResponse = await getUserSupplyChains(userData.id);
      
      if (response.status === 'success' && response.data) {
        setSupplyChains(response.data);
        setDataFetched(true);
      } else {
        setError('Failed to load supply chains');
      }
    } catch (err) {
      console.error('Error fetching supply chains:', err);
      setError(err instanceof Error ? err.message : 'Failed to load supply chains');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Wait for user loading to complete
    if (userLoading) {
      return;
    }

    // If user loading is complete but no user data, set error
    if (!userData?.id) {
      setError('User not found. Please log in.');
      return;
    }

    // Skip fetching if data has already been fetched
    if (dataFetched) {
      return;
    }

    // User is loaded and available, fetch supply chains
    setLoading(true);
    fetchSupplyChains();
  }, [userLoading, userData?.id, dataFetched]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setDataFetched(false); // Reset the flag to allow refetching
    await fetchSupplyChains();
  };

  const handleDelete = async (supplyChainId: string, supplyChainName: string) => {
    if (!userData?.id) {
      toast.error('User not found. Please log in.');
      return;
    }

    // Open confirmation dialog
    setSupplyChainToDelete({ id: supplyChainId, name: supplyChainName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplyChainToDelete || !userData?.id) {
      return;
    }

    setDeleting(true);
    try {
      await deleteSupplyChainViaEdgeFunction(supplyChainToDelete.id, userData.id);
      toast.success('Supply chain deleted successfully');
      
      // Update local state directly by removing the deleted supply chain
      setSupplyChains(prevChains => 
        prevChains.filter(chain => chain.supply_chain_id !== supplyChainToDelete.id)
      );
    } catch (error) {
      console.error('Error deleting supply chain:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete supply chain');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSupplyChainToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setSupplyChainToDelete(null);
  };

  const formatSupplyChainForCard = (chain: SupplyChainData) => {
    const riskLevel = chain.form_data?.risks?.length > 2 ? 'High Risk' : 
                     chain.form_data?.risks?.length > 1 ? 'Medium Risk' : 'Low Risk';
    
    const date = new Date(chain.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });

    return {
      id: chain.supply_chain_id,
      name: chain.name || 'Unnamed Supply Chain',
      description: chain.description || `${chain.organisation?.industry || 'Supply chain'} operations in ${chain.organisation?.location || 'multiple locations'}`,
      tags: [
        chain.form_data?.industry || chain.organisation?.industry || 'General',
        riskLevel,
        date
      ].filter(Boolean),
    };
  };

  // Show loading skeleton while user is loading or supply chains are loading
  if (userLoading || loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 dark:from-gray-900 dark:to-slate-900 overflow-x-hidden">
        {/* Enhanced background blurred elements for light mode */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 dark:bg-purple-900 opacity-30 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 dark:bg-blue-900 opacity-25 blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 dark:bg-emerald-900 opacity-20 blur-2xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-gradient-to-br from-orange-300 to-amber-400 dark:bg-orange-900 opacity-15 blur-3xl animate-pulse"></div>
        
        <div className="relative p-4 sm:p-6 lg:p-8">
          <header className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </header>
          <main>
            <div className="mb-6">
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <GlassmorphicCard key={i} className="space-y-4 p-6">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-14" />
                  </div>
                </GlassmorphicCard>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 dark:from-gray-900 dark:to-slate-900 overflow-x-hidden">
        {/* Enhanced background blurred elements for light mode */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 dark:bg-purple-900 opacity-30 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 dark:bg-blue-900 opacity-25 blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 dark:bg-emerald-900 opacity-20 blur-2xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-gradient-to-br from-orange-300 to-amber-400 dark:bg-orange-900 opacity-15 blur-3xl animate-pulse"></div>
        
        <div className="relative p-4 sm:p-6 lg:p-8">
          <header className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                My Digital Twins
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                Manage and monitor your supply chain digital twins
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="shadow-md border-white/30 dark:border-slate-700/10 bg-white/70 dark:bg-slate-900/5 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-slate-900/10"
              >
                <RefreshCWIcon className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} size={16} />
                Retry
              </Button>
              <Button onClick={() => setView('create')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                <PlusIcon size={16} className="mr-2" />
                Create New Twin
              </Button>
            </div>
          </header>
          <GlassmorphicCard className="p-6">
            <Alert variant="destructive" className="border-red-200/30 bg-red-50/70 dark:bg-red-900/5 backdrop-blur-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </GlassmorphicCard>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 dark:from-gray-900 dark:to-slate-900 overflow-x-hidden">
      {/* Enhanced background blurred elements for light mode */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 dark:bg-purple-900 opacity-30 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 dark:bg-blue-900 opacity-25 blur-3xl"></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 dark:bg-emerald-900 opacity-20 blur-2xl"></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-gradient-to-br from-orange-300 to-amber-400 dark:bg-orange-900 opacity-15 blur-3xl animate-pulse"></div>
      
      <div className="relative p-4 sm:p-6 lg:p-8">
        <header className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              My Digital Twins
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Manage and monitor your supply chain digital twins
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="shadow-md border-white/30 dark:border-slate-700/10 bg-white/70 dark:bg-slate-900/5 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-slate-900/10"
            >
              <RefreshCWIcon className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} size={16} />
              Refresh
            </Button>
            <Button onClick={() => setView('create')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300">
              <PlusIcon size={16} className="mr-2" />
              Create New Twin
            </Button>
          </div>
        </header>
        
        <main>
          {supplyChains.length === 0 ? (
            <GlassmorphicCard className="text-center py-12">
              <div className="mx-auto max-w-md">
                <div className="mx-auto h-12 w-12 text-slate-600 dark:text-slate-400 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">No Digital Twins Found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Get started by creating your first supply chain digital twin
                </p>
                <Button onClick={() => setView('create')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <PlusIcon size={16} className="mr-2" />
                  Create Your First Twin
                </Button>
              </div>
            </GlassmorphicCard>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {supplyChains.length} supply chain{supplyChains.length !== 1 ? 's' : ''} found
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supplyChains.map((chain) => (
                  <div key={chain.supply_chain_id} className="group relative">
                    <GlassmorphicCard className="h-full transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:bg-white/80 dark:hover:bg-slate-900/10">
                      <DigitalTwinCard 
                        twin={formatSupplyChainForCard(chain)} 
                      />
                    </GlassmorphicCard>
                    
                    {/* Delete Icon - appears on hover */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute bottom-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-70 hover:opacity-100 transition-all duration-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 z-10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(chain.supply_chain_id, chain.name);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md border border-white/30 dark:border-slate-700/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Delete Supply Chain
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <span className="font-semibold">"{supplyChainToDelete?.name}"</span>? 
              This action cannot be undone and will permanently remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={deleting}
              className="flex-1 border-white/30 dark:border-slate-700/10 bg-white/70 dark:bg-slate-900/5 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-slate-900/10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 shadow-md"
            >
              {deleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 