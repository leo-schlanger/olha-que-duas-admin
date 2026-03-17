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
              <img src="https://www.olhaqueduas.com/assets/logo-olha-que-duas-BfEMMZfu.png" alt="Olha que Duas" style="height: 100px; width: auto;">
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

          <!-- Share CTA Section -->
          <tr>
            <td style="padding: 0 24px 24px 24px; background-color: #FAF9F6;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #E63946 0%, #c41d2d 100%); border-radius: 16px; overflow: hidden;">
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    <!-- Gift Icon -->
                    <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 1px;">
                      🎁 Partilha
                    </p>

                    <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
                      Conheces alguém que ia adorar?
                    </h3>

                    <p style="margin: 0 0 20px 0; font-size: 14px; color: rgba(255,255,255,0.9); line-height: 1.6;">
                      Convida quem gostas para receber novidades,<br>
                      <strong>descontos exclusivos</strong> e promoções especiais!
                    </p>

                    <!-- CTA Button -->
                    <a href="https://olhaqueduas.com/newsletter" style="display: inline-block; background-color: #ffffff; color: #E63946; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">
                      ✨ Subscrever Newsletter
                    </a>

                    <p style="margin: 16px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.6);">
                      olhaqueduas.com/newsletter
                    </p>
                  </td>
                </tr>
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
                    <a href="https://www.instagram.com/olhaqueduas2025" style="text-decoration: none;">
                      <img src="https://img.icons8.com/color/48/instagram-new.png" alt="Instagram" width="40" height="40" style="display: block; border: 0;">
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://youtube.com/@olhaqueduas-l9m?si=hKFnzKpluIODLFFk" style="text-decoration: none;">
                      <img src="https://img.icons8.com/color/48/youtube-play.png" alt="YouTube" width="40" height="40" style="display: block; border: 0;">
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://www.tiktok.com/@olha.que.duas_" style="text-decoration: none;">
                      <img src="https://img.icons8.com/color/48/tiktok--v1.png" alt="TikTok" width="40" height="40" style="display: block; border: 0;">
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://www.facebook.com/share/17npXT7nNb/" style="text-decoration: none;">
                      <img src="https://img.icons8.com/color/48/facebook-new.png" alt="Facebook" width="40" height="40" style="display: block; border: 0;">
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
