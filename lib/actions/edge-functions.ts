"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function invokeEdgeFunction(functionName: string, body: any) {
  try {
    const { data, error } = await supabaseServer.functions.invoke(functionName, {
      body,
    });

    if (error) {
      console.error(`Edge function ${functionName} error:`, error);
      return { data: null, error: error.message || `Failed to invoke ${functionName}` };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error(`Internal error invoking ${functionName}:`, error);
    return { data: null, error: error.message };
  }
}

// Specific wrappers for convenience
export async function getUserSupplyChainsAction(userId: string) {
  try {
    const { data, error } = await invokeEdgeFunction('super-worker', { user_id: userId });
    
    // If edge function works, return its response
    if (!error && data) {
      return { data, error: null };
    }

    console.warn("Edge function failed, falling back to database fetch:", error);
    
    // Fallback: Fetch directly from database
    const { data: supplyChains, error: scError } = await supabaseServer
      .from('supply_chains')
      .select('*')
      .eq('user_id', userId);

    if (scError) {
      return { data: null, error: scError.message };
    }

    // For each supply chain, fetch nodes and edges
    const enrichedData = await Promise.all((supplyChains || []).map(async (sc) => {
      const [{ data: nodes }, { data: edges }] = await Promise.all([
        supabaseServer.from('nodes').select('*').eq('supply_chain_id', sc.supply_chain_id),
        supabaseServer.from('edges').select('*').eq('supply_chain_id', sc.supply_chain_id)
      ]);

      return {
        ...sc,
        organisation: sc.organisation || {},
        form_data: sc.form_data || {},
        nodes: nodes || [],
        edges: edges || []
      };
    }));

    return { 
      data: { 
        status: 'success', 
        data: enrichedData,
        meta: {
          total_supply_chains: enrichedData.length,
          total_nodes: enrichedData.reduce((acc, sc) => acc + sc.nodes.length, 0),
          total_edges: enrichedData.reduce((acc, sc) => acc + sc.edges.length, 0)
        }
      }, 
      error: null 
    };
  } catch (err: any) {
    console.error("Critical error in getUserSupplyChainsAction:", err);
    return { data: null, error: err.message };
  }
}

export async function saveSupplyChainAction(supplyChainData: any) {
  return invokeEdgeFunction('bright-processor', supplyChainData);
}

export async function deleteSupplyChainAction(supplyChainId: string, organisationId: string) {
  return invokeEdgeFunction('quick-api', {
    supply_chain_id: supplyChainId,
    organisation_id: organisationId,
  });
}

export async function getSupplyChainByIdAction(supplyChainId: string) {
  try {
    const { data, error } = await invokeEdgeFunction('dynamic-endpoint', { supply_chain_id: supplyChainId });
    
    if (!error && data) {
      return { data, error: null };
    }

    console.warn("dynamic-endpoint edge function failed, falling back to database fetch:", error);

    // Fallback: Fetch directly from database
    const { data: supplyChain, error: scError } = await supabaseServer
      .from('supply_chains')
      .select('*')
      .eq('supply_chain_id', supplyChainId)
      .single();

    if (scError) {
      return { data: null, error: scError.message };
    }

    const [{ data: nodes }, { data: edges }] = await Promise.all([
      supabaseServer.from('nodes').select('*').eq('supply_chain_id', supplyChainId),
      supabaseServer.from('edges').select('*').eq('supply_chain_id', supplyChainId)
    ]);

    return {
      data: {
        ...supplyChain,
        nodes: nodes || [],
        edges: edges || []
      },
      error: null
    };
  } catch (err: any) {
    console.error("Critical error in getSupplyChainByIdAction:", err);
    return { data: null, error: err.message };
  }
}

export async function getNewsRoomInfoAction(userId: string) {
  try {
    const { data, error } = await invokeEdgeFunction('get-news-room-info', { user_id: userId });
    
    if (!error && data) {
      return { data, error: null };
    }

    console.warn("get-news-room-info edge function failed, falling back to empty data:", error);

    // Fallback: Currently returning empty data, but this could be expanded
    // to fetch relevant news/events from the DB if a specific table exists.
    return { 
      data: {}, // Return empty object to prevent UI crashes
      error: null 
    };
  } catch (err: any) {
    console.error("Critical error in getNewsRoomInfoAction:", err);
    return { data: {}, error: err.message };
  }
}
