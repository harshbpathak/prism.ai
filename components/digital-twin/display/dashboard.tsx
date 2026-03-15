"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQueryState, parseAsString } from 'nuqs';
import { getUserSupplyChains, deleteSupplyChainViaEdgeFunction } from '@/lib/api/supply-chain';
import { useUser } from '@/lib/stores/user';
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
      <div className="relative min-h-full flex-1 flex flex-col bg-white dark:bg-black overflow-x-hidden text-black dark:text-white">
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-4 w-40 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
            <div className="h-3 w-64 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
          </div>
          <div className="h-8 w-28 bg-slate-100 dark:bg-slate-900 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-full flex-1 flex flex-col bg-white dark:bg-black text-black dark:text-white">
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">Network Registry</p>
            <h1 className="text-base font-semibold text-black dark:text-white mt-0.5">Operation Network Graphs</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-black transition-colors"
            >
              <RefreshCWIcon className={`${refreshing ? 'animate-spin' : ''}`} size={12} />
              Retry
            </button>
            <button onClick={() => setView('create')} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-black text-white dark:bg-white dark:text-black">
              <PlusIcon size={12} />
              New Graph
            </button>
          </div>
        </div>
        <div className="p-6">
          <Alert variant="destructive" className="border-red-200 dark:border-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-black overflow-x-hidden text-black dark:text-white flex flex-col">

      {/* Top Action Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">Network Registry</p>
          <h1 className="text-base font-semibold text-black dark:text-white mt-0.5">
            Operation Network Graphs
            {supplyChains.length > 0 && (
              <span className="ml-2 text-[10px] font-normal text-slate-400 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5">
                {supplyChains.length} registered
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-black dark:hover:text-white hover:border-slate-400 transition-colors"
          >
            <RefreshCWIcon className={`${refreshing ? 'animate-spin' : ''}`} size={12} />
            Sync
          </button>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-black text-white dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            <PlusIcon size={12} />
            Register Graph
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {supplyChains.length === 0 ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
            <div className="text-center max-w-sm p-10 border border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-black dark:text-white mb-2">Registry Empty</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                No operation network graphs have been registered. Create your first graph to begin resilience modeling.
              </p>
              <button
                onClick={() => setView('create')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs bg-black text-white dark:bg-white dark:text-black hover:bg-slate-800 transition-colors"
              >
                <PlusIcon size={12} />
                Register First Graph
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center border-b border-slate-200 dark:border-slate-800 px-6 py-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold gap-4">
              <span>Graph Name</span>
              <span>Industry</span>
              <span>Exposure Profile</span>
              <span>Registered</span>
              <span></span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-900">
              {supplyChains.map((chain) => {
                const riskLevel = chain.form_data?.risks?.length > 2 ? 'High' :
                                  chain.form_data?.risks?.length > 1 ? 'Medium' : 'Low';
                // Fallback to created_at if timestamp is missing from the database record
                const chainDate = chain.timestamp || (chain as any).created_at || new Date().toISOString();
                const date = new Date(chainDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                const industry = chain.form_data?.industry || chain.organisation?.industry || 'General';
                const nodeCount = chain.nodes?.length || 0;
                const edgeCount = chain.edges?.length || 0;

                return (
                  <div key={chain.supply_chain_id} className="group grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center px-6 py-3.5 gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <button
                      className="flex items-start gap-3 text-left min-w-0"
                      onClick={() => {
                        setView(`view:${chain.supply_chain_id}`);
                      }}
                    >
                      <div className="w-7 h-7 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-500 mt-0.5 uppercase">
                        {chain.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <p className="text-sm font-medium text-black dark:text-white truncate group-hover:underline underline-offset-2">
                          {chain.name || 'Unnamed Network'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {nodeCount} nodes · {edgeCount} connections
                        </p>
                      </div>
                    </button>


                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{industry}</span>

                    <span className={`text-[11px] font-medium ${
                      riskLevel === 'High' ? 'text-red-600' :
                      riskLevel === 'Medium' ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      ● {riskLevel}
                    </span>

                    <span className="text-xs text-slate-500">{date}</span>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(chain.supply_chain_id, chain.name);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-black shadow-none rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black dark:text-white text-sm font-semibold">
              <AlertCircle className="h-4 w-4" />
              Deregister Network Graph
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-2 text-xs">
              Remove <span className="font-semibold text-black dark:text-white">"{supplyChainToDelete?.name}"</span> from the registry?
              This permanently deletes all associated node and edge data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={deleting}
              className="flex-1 border-slate-200 dark:border-slate-800 rounded-none shadow-none text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-none rounded-none text-xs"
            >
              {deleting ? (
                <>
                  <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Removing…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-3 w-3" />
                  Deregister
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}