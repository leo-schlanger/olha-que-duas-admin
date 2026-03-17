import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContentBlock {
  id: string;
  content: string;
}

interface SendRequest {
  subject: string;
  blocks: ContentBlock[];
  testEmail?: string;
}

function generateEmailTemplate(blocks: ContentBlock[]): string {
  const blocksHtml = blocks
    .filter((block) => block.content.trim())
    .map(
      (block) => `
      <tr>
        <td style="padding: 12px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #E8E4DC;">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0; font-size: 15px; color: #2D2D2D; line-height: 1.7; white-space: pre-wrap;">
                  ${block.content.replace(/\n/g, "<br>")}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Olha que Duas</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF9F6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

          <!-- Header with Logo -->
          <tr>
            <td style="background-color: #2D2D2D; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
              <img src="https://olhaqueduas.com/logo-olha-que-duas.png" alt="Olha que Duas" style="height: 80px; width: auto;">
            </td>
          </tr>

          <!-- Yellow/Red Gradient Bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #F4C430 0%, #E63946 100%);"></td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color: #FAF9F6; padding: 32px 24px;">
              <!-- Greeting -->
              <p style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #2D2D2D;">
                Olá!
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #666666; line-height: 1.5;">
                Aqui estão as novidades da Olha que Duas.
              </p>

              <!-- Content Blocks -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${blocksHtml}
              </table>
            </td>
          </tr>

          <!-- Social Footer -->
          <tr>
            <td style="background-color: #F4C430; padding: 24px; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #2D2D2D;">
                Segue-nos nas redes sociais!
              </p>
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="https://instagram.com/olhaqueduas" style="display: inline-block; width: 44px; height: 44px; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); border-radius: 12px; text-align: center; line-height: 44px; text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 24px; height: 24px; margin-top: 10px;">
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://youtube.com/@olhaqueduas" style="display: inline-block; width: 44px; height: 44px; background-color: #FF0000; border-radius: 12px; text-align: center; line-height: 44px; text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/174/174883.png" alt="YouTube" style="width: 24px; height: 24px; margin-top: 10px;">
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://facebook.com/olhaqueduas" style="display: inline-block; width: 44px; height: 44px; background-color: #1877F2; border-radius: 12px; text-align: center; line-height: 44px; text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/174/174848.png" alt="Facebook" style="width: 24px; height: 24px; margin-top: 10px;">
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #2D2D2D; padding: 24px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #ffffff;">
                &copy; ${new Date().getFullYear()} Olha que Duas
              </p>
              <p style="margin: 0; font-size: 12px;">
                <a href="{{unsubscribe}}" style="color: #F4C430; text-decoration: none;">
                  Cancelar subscrição
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    const BREVO_LIST_ID = Deno.env.get("BREVO_LIST_ID") || "2";
    const BREVO_SENDER_EMAIL =
      Deno.env.get("BREVO_SENDER_EMAIL") || "newsletter@olhaqueduas.com";
    const BREVO_SENDER_NAME =
      Deno.env.get("BREVO_SENDER_NAME") || "Olha que Duas";

    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY not configured");
    }

    const { subject, blocks, testEmail }: SendRequest = await req.json();

    if (!subject || !blocks || blocks.length === 0) {
      return new Response(
        JSON.stringify({ error: "Subject and at least one block are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const htmlContent = generateEmailTemplate(blocks);

    let response;

    if (testEmail) {
      // Send test email to single recipient
      response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "api-key": BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: {
            name: BREVO_SENDER_NAME,
            email: BREVO_SENDER_EMAIL,
          },
          to: [{ email: testEmail }],
          subject: `[TESTE] ${subject}`,
          htmlContent: htmlContent,
        }),
      });
    } else {
      // Send campaign to entire list
      const createResponse = await fetch(
        "https://api.brevo.com/v3/emailCampaigns",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "api-key": BREVO_API_KEY,
          },
          body: JSON.stringify({
            name: `Newsletter - ${new Date().toLocaleDateString("pt-PT")}`,
            subject: subject,
            sender: {
              name: BREVO_SENDER_NAME,
              email: BREVO_SENDER_EMAIL,
            },
            type: "classic",
            htmlContent: htmlContent,
            recipients: {
              listIds: [parseInt(BREVO_LIST_ID)],
            },
          }),
        }
      );

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || "Failed to create campaign");
      }

      const campaignData = await createResponse.json();

      // Now send the campaign
      response = await fetch(
        `https://api.brevo.com/v3/emailCampaigns/${campaignData.id}/sendNow`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "api-key": BREVO_API_KEY,
          },
        }
      );
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send newsletter");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: testEmail
          ? `Email de teste enviado para ${testEmail}`
          : "Newsletter enviada com sucesso!",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
