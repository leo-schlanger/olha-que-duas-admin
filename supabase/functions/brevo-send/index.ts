import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewsletterPost {
  titulo: string;
  resumo: string;
  image_url: string;
  link: string;
  categoria: string;
}

interface SendRequest {
  subject: string;
  noticias: NewsletterPost[];
  testEmail?: string; // If provided, send only to this email for testing
}

function generateEmailTemplate(noticias: NewsletterPost[]): string {
  const noticiasHtml = noticias
    .map(
      (noticia) => `
    <tr>
      <td style="padding: 20px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          ${
            noticia.image_url
              ? `
          <tr>
            <td>
              <img src="${noticia.image_url}" alt="${noticia.titulo}" style="width: 100%; height: 200px; object-fit: cover; display: block;">
            </td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #E63946; text-transform: uppercase; letter-spacing: 1px;">
                ${noticia.categoria}
              </p>
              <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #2D2D2D; line-height: 1.3;">
                ${noticia.titulo}
              </h3>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #666666; line-height: 1.6;">
                ${noticia.resumo}
              </p>
              <a href="${noticia.link}" style="display: inline-block; padding: 12px 24px; background-color: #E63946; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px;">
                Ler mais &rarr;
              </a>
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
<body style="margin: 0; padding: 0; background-color: #F5F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F5F0;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background-color: #2D2D2D; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
              <img src="https://olhaqueduas.com/logo-olha-que-duas.png" alt="Olha que Duas" style="height: 50px; width: auto;">
            </td>
          </tr>

          <!-- Yellow Bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #F4C430 0%, #E63946 100%);"></td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color: #FAF9F6; padding: 32px 24px;">
              <!-- Greeting -->
              <p style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #2D2D2D;">
                Olá {{params.NOME}}!
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #666666; line-height: 1.5;">
                Aqui estão as últimas notícias do mundo Olha que Duas.
              </p>

              <!-- Gradient Divider -->
              <div style="height: 3px; background: linear-gradient(90deg, #E63946 0%, #F4C430 100%); border-radius: 2px; margin-bottom: 8px;"></div>

              <!-- News Items -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${noticiasHtml}
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
                  <td style="padding: 0 8px;">
                    <a href="https://instagram.com/olhaqueduas" style="display: inline-block; width: 40px; height: 40px; background-color: #2D2D2D; border-radius: 50%; text-align: center; line-height: 40px; color: #ffffff; text-decoration: none; font-size: 18px;">
                      IG
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="https://youtube.com/@olhaqueduas" style="display: inline-block; width: 40px; height: 40px; background-color: #2D2D2D; border-radius: 50%; text-align: center; line-height: 40px; color: #ffffff; text-decoration: none; font-size: 18px;">
                      YT
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="https://facebook.com/olhaqueduas" style="display: inline-block; width: 40px; height: 40px; background-color: #2D2D2D; border-radius: 50%; text-align: center; line-height: 40px; color: #ffffff; text-decoration: none; font-size: 18px;">
                      FB
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
                &copy; ${new Date().getFullYear()} Olha que Duas • Todos os direitos reservados
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

    const { subject, noticias, testEmail }: SendRequest = await req.json();

    if (!subject || !noticias || noticias.length === 0) {
      return new Response(
        JSON.stringify({ error: "Subject and at least one post are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const htmlContent = generateEmailTemplate(noticias);

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
          htmlContent: htmlContent.replace("{{params.NOME}}", "Teste"),
        }),
      });
    } else {
      // Send campaign to entire list
      // First create the campaign
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
