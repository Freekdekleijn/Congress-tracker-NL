import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Congress Trading Tracker App" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function syncMembers(): Promise<{ membersFetched: number; membersAdded: number }> {
  console.log("Fetching congress members from GovTrack...");

  try {
    const response = await fetchWithTimeout(
      "https://www.govtrack.us/api/v2/role?current=true&limit=600",
      8000
    );

    if (!response.ok) {
      console.error(`GovTrack API error: ${response.status}`);
      return { membersFetched: 0, membersAdded: 0 };
    }

    const data = await response.json();
    const members = data.objects.map((role: any) => ({
      full_name: role.person.name,
      state: role.state,
      party: role.party === "Democrat" ? "Democrat" : role.party === "Republican" ? "Republican" : "Independent",
      chamber: role.role_type === "senator" ? "Senate" : "House",
    }));

    console.log(`Fetched ${members.length} members, syncing to database...`);

    const { data: existingMembers } = await supabase
      .from("congress_members")
      .select("full_name, state");

    const existingSet = new Set(
      (existingMembers || []).map((m: any) => `${m.full_name}|${m.state}`)
    );

    const newMembers = members.filter(
      (m) => !existingSet.has(`${m.full_name}|${m.state}`)
    );

    if (newMembers.length > 0) {
      const { error } = await supabase
        .from("congress_members")
        .insert(newMembers);

      if (error) {
        console.error("Batch insert error:", error.message);
        return { membersFetched: members.length, membersAdded: 0 };
      }
    }

    console.log(`Members sync complete: ${newMembers.length} new members added`);
    return { membersFetched: members.length, membersAdded: newMembers.length };

  } catch (error) {
    console.error("Members sync error:", error);
    return { membersFetched: 0, membersAdded: 0 };
  }
}

async function syncTrades(): Promise<{ tradesFetched: number; tradesAdded: number }> {
  console.log("Fetching stock trades from House Stock Watcher API...");

  try {
    const response = await fetchWithTimeout(
      "https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json",
      10000
    );

    if (!response.ok) {
      console.error(`Stock trades API error: ${response.status}`);
      return { tradesFetched: 0, tradesAdded: 0 };
    }

    const trades = await response.json();
    console.log(`Fetched ${trades.length} trades from API`);

    const { data: members } = await supabase
      .from("congress_members")
      .select("id, full_name");

    const memberMap = new Map(
      (members || []).map((m: any) => [m.full_name.toLowerCase(), m.id])
    );

    const { data: existingTrades } = await supabase
      .from("stock_trades")
      .select("disclosure_date, ticker, amount, member_id");

    const existingSet = new Set(
      (existingTrades || []).map((t: any) =>
        `${t.disclosure_date}|${t.ticker}|${t.amount}|${t.member_id}`
      )
    );

    const newTrades = trades
      .filter((trade: any) => {
        const memberId = memberMap.get(trade.representative?.toLowerCase());
        if (!memberId) return false;

        const key = `${trade.disclosure_date}|${trade.ticker}|${trade.amount}|${memberId}`;
        return !existingSet.has(key);
      })
      .map((trade: any) => ({
        member_id: memberMap.get(trade.representative?.toLowerCase()),
        disclosure_date: trade.disclosure_date,
        transaction_date: trade.transaction_date,
        ticker: trade.ticker,
        asset_description: trade.asset_description || null,
        type: trade.type === "purchase" ? "purchase" : "sale",
        amount: trade.amount,
        comment: trade.comment || null,
      }))
      .slice(0, 1000);

    if (newTrades.length > 0) {
      const { error } = await supabase
        .from("stock_trades")
        .insert(newTrades);

      if (error) {
        console.error("Batch insert trades error:", error.message);
        return { tradesFetched: trades.length, tradesAdded: 0 };
      }
    }

    console.log(`Trades sync complete: ${newTrades.length} new trades added`);
    return { tradesFetched: trades.length, tradesAdded: newTrades.length };

  } catch (error) {
    console.error("Trades sync error:", error);
    return { tradesFetched: 0, tradesAdded: 0 };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Starting congress data sync...");

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 25000)
    );

    const syncPromise = (async () => {
      const membersResult = await syncMembers();
      const tradesResult = await syncTrades();

      return {
        members: membersResult,
        trades: tradesResult,
      };
    })();

    const result = await Promise.race([syncPromise, timeoutPromise]);

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Congress data sync completed",
        timestamp: new Date().toISOString(),
        result,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Function error:", errorMessage);

    return new Response(
      JSON.stringify({
        status: "error",
        message: errorMessage,
        timestamp: new Date().toISOString(),
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