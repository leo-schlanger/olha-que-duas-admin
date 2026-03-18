import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Block types
interface TextBlock {
  id: string;
  type: 'text';
  content: string;
}

interface ImageBlock {
  id: string;
  type: 'image';
  imageUrl: string;
  altText?: string;
  caption?: string;
}

type ContentBlock = TextBlock | ImageBlock;

// Legacy block support (no type property)
interface LegacyBlock {
  id: string;
  content: string;
}

interface SendRequest {
  subject: string;
  blocks: (ContentBlock | LegacyBlock)[];
  testEmail?: string;
}

function generateBlockHtml(block: ContentBlock | LegacyBlock): string {
  // Handle image blocks
  if ('type' in block && block.type === 'image') {
    if (!block.imageUrl) return '';
    return `
      <tr>
        <td style="padding: 10px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #f0f0f0;">
            <tr>
              <td style="padding: 0;">
                <img src="${block.imageUrl}" alt="${block.altText || 'Imagem'}" style="display: block; width: 100%; height: auto; border: 0;">
              </td>
            </tr>
            ${block.caption ? `
            <tr>
              <td style="padding: 12px 16px; background-color: #f9f9f9; border-top: 1px solid #f0f0f0;">
                <p style="margin: 0; font-size: 14px; color: #666666; text-align: center; font-style: italic;">
                  ${block.caption}
                </p>
              </td>
            </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    `;
  }

  // Handle text blocks (both new and legacy format)
  const content = 'type' in block && block.type === 'text'
    ? block.content
    : ('content' in block ? block.content : '');

  if (!content.trim()) return '';

  return `
    <tr>
      <td style="padding: 10px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #f0f0f0;">
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0; font-size: 16px; color: #2D2D2D; line-height: 1.7; white-space: pre-wrap;">
                ${content.replace(/\n/g, "<br>")}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function generateEmailTemplate(blocks: (ContentBlock | LegacyBlock)[]): string {
  const blocksHtml = blocks
    .map(generateBlockHtml)
    .filter(html => html.trim())
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Olha que Duas</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAFAFA;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header with Logo - LARGER -->
          <tr>
            <td style="background-color: #2D2D2D; padding: 48px 32px; text-align: center;">
              <img src="https://www.olhaqueduas.com/assets/logo-olha-que-duas-BfEMMZfu.png" alt="Olha que Duas" style="height: 140px; width: auto;">
            </td>
          </tr>

          <!-- Elegant Gradient Divider -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #F4C430 0%, #E8A825 50%, #E63946 100%);"></td>
          </tr>

          <!-- Content Area -->
          <tr>
            <td style="background-color: #FAFAFA; padding: 40px 32px;">
              <!-- Greeting - More elegant -->
              <p style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #2D2D2D; font-family: Georgia, serif;">
                Olá!
              </p>
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #666666; line-height: 1.6;">
                Aqui estão as novidades da <span style="font-weight: 600; color: #E63946;">Olha que Duas</span>.
              </p>

              <!-- Subtle Divider -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="width: 60px; height: 3px; background: linear-gradient(90deg, #F4C430 0%, #E63946 100%); border-radius: 2px;"></td>
                </tr>
              </table>

              <!-- Content Blocks -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${blocksHtml}
              </table>
            </td>
          </tr>

          <!-- Share CTA Section - Cleaner design -->
          <tr>
            <td style="padding: 0 32px 32px 32px; background-color: #FAFAFA;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #2D2D2D; border-radius: 16px; overflow: hidden;">
                <!-- Top accent -->
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, #F4C430 0%, #E63946 100%);"></td>
                </tr>
                <tr>
                  <td style="padding: 40px 32px; text-align: center;">
                    <!-- Badge -->
                    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom: 16px;">
                      <tr>
                        <td style="background-color: #E63946; color: #ffffff; font-size: 11px; font-weight: 600; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
                          ❤️ PARTILHA
                        </td>
                      </tr>
                    </table>

                    <h3 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #ffffff;">
                      Conheces alguém que ia adorar?
                    </h3>

                    <p style="margin: 0 0 24px 0; font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.6; max-width: 320px; margin-left: auto; margin-right: auto;">
                      Convida quem gostas para receber novidades e <span style="color: #F4C430; font-weight: 600;">ofertas exclusivas</span>!
                    </p>

                    <!-- CTA Button - Elegant gold gradient -->
                    <a href="https://olhaqueduas.com/newsletter" style="display: inline-block; background: linear-gradient(90deg, #F4C430 0%, #E8A825 100%); color: #2D2D2D; font-weight: 700; font-size: 14px; padding: 16px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(0,0,0,0.2);">
                      Subscrever Newsletter
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Social Footer - Elegant gradient -->
          <tr>
            <td style="background: linear-gradient(180deg, #F4C430 0%, #E8A825 100%); padding: 32px; text-align: center;">
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: 600; color: #2D2D2D; text-transform: uppercase; letter-spacing: 1px;">
                Segue-nos nas redes sociais
              </p>
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="https://www.instagram.com/olhaqueduas2025" style="text-decoration: none;">
                      <img src="https://img.icons8.com/color/48/instagram-new.png" alt="Instagram" width="44" height="44" style="display: block; border: 0;">
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://youtube.com/@olhaqueduas-l9m?si=hKFnzKpluIODLFFk" style="text-decoration: none;">
                      <img src="https://img.icons8.com/color/48/youtube-play.png" alt="YouTube" width="44" height="44" style="display: block; border: 0;">
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://www.tiktok.com/@olha.que.duas_" style="text-decoration: none;">
                      <img src="https://img.icons8.com/color/48/tiktok--v1.png" alt="TikTok" width="44" height="44" style="display: block; border: 0;">
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://www.facebook.com/share/17npXT7nNb/" style="text-decoration: none;">
                      <img src="https://img.icons8.com/color/48/facebook-new.png" alt="Facebook" width="44" height="44" style="display: block; border: 0;">
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer - More professional -->
          <tr>
            <td style="background-color: #2D2D2D; padding: 28px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: rgba(255,255,255,0.6);">
                &copy; ${new Date().getFullYear()} Olha que Duas - Todos os direitos reservados
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
