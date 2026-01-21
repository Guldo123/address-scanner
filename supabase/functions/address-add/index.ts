import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AddressData {
  full_text: string;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const addressData: AddressData = await req.json();

    if (!addressData.full_text) {
      return new Response(
        JSON.stringify({ error: "full_text is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data, error } = await supabase
      .from("addresses")
      .insert({
        address: addressData.full_text,
        full_text: addressData.full_text,
        salutation: addressData.salutation || null,
        first_name: addressData.first_name || null,
        last_name: addressData.last_name || null,
        company: addressData.company || null,
        street_name: addressData.street_name || null,
        street_number: addressData.street_number || null,
        postal_code: addressData.postal_code || null,
        place: addressData.place || null,
        image_data: addressData.image_data || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ address: data }),
      {
        status: 201,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Add address error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to add address"
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
