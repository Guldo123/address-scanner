import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AddressData {
  full_text?: string;
  salutation?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  street_name?: string;
  street_number?: string;
  postal_code?: string;
  place?: string;
  image_data?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id || id === 'address-update') {
      return new Response(
        JSON.stringify({ error: "Address ID is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const addressData: AddressData = await req.json();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (addressData.full_text !== undefined) {
      updateData.address = addressData.full_text;
      updateData.full_text = addressData.full_text;
    }
    if (addressData.salutation !== undefined) updateData.salutation = addressData.salutation || null;
    if (addressData.first_name !== undefined) updateData.first_name = addressData.first_name || null;
    if (addressData.last_name !== undefined) updateData.last_name = addressData.last_name || null;
    if (addressData.company !== undefined) updateData.company = addressData.company || null;
    if (addressData.street_name !== undefined) updateData.street_name = addressData.street_name || null;
    if (addressData.street_number !== undefined) updateData.street_number = addressData.street_number || null;
    if (addressData.postal_code !== undefined) updateData.postal_code = addressData.postal_code || null;
    if (addressData.place !== undefined) updateData.place = addressData.place || null;
    if (addressData.image_data !== undefined) updateData.image_data = addressData.image_data || null;

    const { data, error } = await supabase
      .from("addresses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: "Address not found" }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
      throw error;
    }

    return new Response(
      JSON.stringify({ address: data }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Update address error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to update address"
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
