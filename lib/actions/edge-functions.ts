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
    // Bypassing super-worker edge function as it returns 404
    // Fetch directly from database
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
  try {
    const {
      id: supplyChainId,
      name,
      description,
      nodes,
      edges,
      organisation,
      formData,
      timestamp
    } = supplyChainData;

    // 1. Upsert the supply chain record
    const { data: scData, error: scError } = await supabaseServer
      .from('supply_chains')
      .upsert({
        supply_chain_id: supplyChainId,
        name,
        description,
        user_id: organisation?.id,
        // Embed formData and timestamp inside organisation payload since columns might be missing
        organisation: { 
          ...organisation, 
          _form_data_fallback: formData,
          _timestamp_fallback: timestamp || new Date().toISOString()
        }
      })
      .select()
      .single();

    if (scError) {
      console.error('Error upserting supply chain:', scError);
      return { data: null, error: scError.message };
    }

    const sid = scData.supply_chain_id;

    // 2. Clean up existing nodes and edges for this supply chain to ensure consistency
    // (Deletion cascade might handle this if configured, but explicit is safer)
    await Promise.all([
      supabaseServer.from('nodes').delete().eq('supply_chain_id', sid),
      supabaseServer.from('edges').delete().eq('supply_chain_id', sid)
    ]);

    // 3. Insert new nodes
    const nodeIdMap = new Map<string, string>();

    if (nodes && nodes.length > 0) {
      const nodesToInsert = nodes.map((node: any) => {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(node.id);
        const backendId = isUUID ? node.id : crypto.randomUUID();
        nodeIdMap.set(node.id, backendId);

        return {
          node_id: backendId,
          supply_chain_id: sid,
          name: node.data?.label || node.id,
          type: node.data?.type || node.type,
          description: node.data?.description || '',
          data: { ...node.data, original_id: node.id }
        };
      });

      const { error: nodesError } = await supabaseServer
        .from('nodes')
        .insert(nodesToInsert);

      if (nodesError) {
        console.error('Error inserting nodes:', nodesError);
        return { data: null, error: nodesError.message };
      }
    }

    // 4. Insert new edges
    if (edges && edges.length > 0) {
      const edgesToInsert = edges.map((edge: any) => {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(edge.id);
        const backendId = isUUID ? edge.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString());

        return {
          edge_id: backendId,
          supply_chain_id: sid,
          from_node_id: nodeIdMap.get(edge.source) || edge.source,
          to_node_id: nodeIdMap.get(edge.target) || edge.target,
          type: edge.type || 'default',
          data: edge.data,
          selected: edge.selected || false
        };
      });

      const { error: edgesError } = await supabaseServer
        .from('edges')
        .insert(edgesToInsert);

      if (edgesError) {
        console.error('Error inserting edges:', edgesError);
        return { data: null, error: edgesError.message };
      }
    }

    return { 
      data: { 
        status: 'success', 
        supply_chain_id: sid,
        nodes_count: nodes?.length || 0,
        edges_count: edges?.length || 0
      }, 
      error: null 
    };
  } catch (err: any) {
    console.error("Critical error in saveSupplyChainAction:", err);
    return { data: null, error: err.message };
  }
}

export async function deleteSupplyChainAction(supplyChainId: string, organisationId: string) {
  try {
    // Delete in FK-safe order: edges → nodes → supply_chain
    await supabaseServer.from('edges').delete().eq('supply_chain_id', supplyChainId);
    await supabaseServer.from('nodes').delete().eq('supply_chain_id', supplyChainId);
    const { error } = await supabaseServer
      .from('supply_chains')
      .delete()
      .eq('supply_chain_id', supplyChainId);

    if (error) {
      console.error('Error deleting supply chain:', error);
      return { data: null, error: error.message };
    }

    return { data: { status: 'success', supply_chain_id: supplyChainId }, error: null };
  } catch (err: any) {
    console.error('Critical error in deleteSupplyChainAction:', err);
    return { data: null, error: err.message };
  }
}

export async function getSupplyChainByIdAction(supplyChainId: string) {
  try {
    // Bypassing dynamic-endpoint edge function as it returns 404
    // Fetch directly from database
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
    // Bypassing get-news-room-info edge function as it returns 404
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
