import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchParams {
  company?: string;
  first_name?: string;
  last_name?: string;
  place?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { company, first_name, last_name, place }: SearchParams = await req.json();

    let query = supabase.from("addresses").select("*");

    const conditions = [];

    if (company && company.trim()) {
      conditions.push({ field: "company", value: company.trim() });
    }

    if (last_name && last_name.trim()) {
      conditions.push({ field: "last_name", value: last_name.trim() });
    }

    if (place && place.trim()) {
      conditions.push({ field: "place", value: place.trim() });
    }

    if (conditions.length === 0) {
      return new Response(
        JSON.stringify({ addresses: [] }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    for (const condition of conditions) {
      query = query.ilike(condition.field, `%${condition.value}%`);
    }

    const { data, error } = await query.order("updated_at", { ascending: false }).limit(10);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ addresses: data || [] }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to search addresses"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
