import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SENDER_EMAIL = "Marriage Database <contact@zielglobal.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, title, message, actionUrl, metadata, html } = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing 'to' or 'subject' field." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let finalHtml = html;

    if (!finalHtml) {
      const isMosqueAdminWelcome = metadata?.type === "mosque_admin_welcome";
      const isUserSignupConfirmation = metadata?.type === "user_signup_confirmation";

      if (isMosqueAdminWelcome) {
        const mosqueName = metadata?.mosqueName || "Your Mosque";
        const location = metadata?.location || "On record";
        const address = metadata?.address || "On record";
        const phone = metadata?.phone || "On record";
        const username = metadata?.toEmail || to;
        const tempPassword = metadata?.tempPassword || "Specified by administrator";
        const portalUrl = metadata?.portalUrl || "https://nikkah-plus-harmony.vercel.app/admin";

        finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1e3a8a; padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Marriage Platform</h1>
              <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 14px;">Mosque Administration & Partner Portal</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">As-salamu alaykum,</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Your Mosque Admin account for <strong>${mosqueName}</strong> has been successfully registered on the Marriage Platform. Below are your mosque registration details and initial login credentials.
              </p>

              <!-- Mosque Details Card -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #2563eb;">
                <h3 style="color: #1e293b; margin: 0 0 12px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Mosque Details</h3>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #334155;">
                  <tr>
                    <td style="padding: 4px 0; width: 130px; font-weight: 600;">Mosque Name:</td>
                    <td style="padding: 4px 0;">${mosqueName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-weight: 600;">Location:</td>
                    <td style="padding: 4px 0;">${location}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-weight: 600;">Address:</td>
                    <td style="padding: 4px 0;">${address}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-weight: 600;">Contact Phone:</td>
                    <td style="padding: 4px 0;">${phone}</td>
                  </tr>
                </table>
              </div>

              <!-- Login Credentials Card -->
              <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #bfdbfe;">
                <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</h3>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #1e3a8a;">
                  <tr>
                    <td style="padding: 6px 0; width: 140px; font-weight: 600;">Login Username:</td>
                    <td style="padding: 6px 0; font-family: monospace; font-size: 15px; font-weight: 700;">${username}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600;">Temporary Password:</td>
                    <td style="padding: 6px 0; font-family: monospace; font-size: 15px; font-weight: 700; color: #2563eb;">${tempPassword}</td>
                  </tr>
                </table>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #fffbebfb; border-radius: 10px; padding: 14px 16px; margin-bottom: 28px; border: 1px solid #fef3c7;">
                <p style="color: #92400e; font-size: 13px; line-height: 1.5; margin: 0;">
                  <strong>🔒 Security Notice:</strong> For security reasons, please change your password immediately after logging into your Mosque Admin Dashboard.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="${portalUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">Access Mosque Admin Dashboard</a>
              </div>

              <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 12px;">
                Direct link: <a href="${portalUrl}" style="color: #2563eb; text-decoration: underline;">${portalUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0 0 6px 0;">Marriage Platform — Supporting trusted, mosque-verified matrimonial introductions.</p>
              <p style="margin: 0;">If you have any questions, please reach out to your platform administrator.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
      } else if (isUserSignupConfirmation) {
        const confirmUrl = metadata?.confirmUrl || metadata?.portalUrl || "https://nikkah-plus-harmony.vercel.app/auth?confirmed=true";

        finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1e3a8a; padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Marriage Platform</h1>
              <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 14px;">Trusted Mosque-Verified Matrimonials</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">As-salamu alaykum,</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for creating an account on Marriage Platform. Please confirm your email address below to complete setting up your account and proceed to sign in.
              </p>

              <!-- Confidentiality Notice Card -->
              <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 28px; border: 1px solid #bfdbfe;">
                <p style="color: #1e40af; font-size: 14px; line-height: 1.5; margin: 0;">
                  <strong>🔒 Confidential & Safe:</strong> Your details remain private and are only verified by your local mosque before any introductions can begin.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0 24px 0;">
                <a href="${confirmUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">Confirm Email Address</a>
              </div>

              <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 12px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${confirmUrl}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${confirmUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0 0 6px 0;">Marriage Platform — Supporting trusted, mosque-verified matrimonial introductions.</p>
              <p style="margin: 0;">If you did not request this account, you can safely ignore this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
      } else {
        // Standard notification template
        finalHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background-color: #f8fafc; padding: 30px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
    <h2 style="color: #1e3a8a; margin-top: 0;">${title || subject}</h2>
    <p style="line-height: 1.6; color: #334155;">${message}</p>
    ${actionUrl ? `<div style="margin-top: 24px;"><a href="https://nikkah-plus-harmony.vercel.app${actionUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Details</a></div>` : ''}
  </div>
</body>
</html>
        `;
      }
    }

    if (RESEND_API_KEY) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: SENDER_EMAIL,
          to: [to],
          subject: subject,
          html: finalHtml,
        }),
      });

      const resendData = await resendRes.json();
      return new Response(JSON.stringify(resendData), {
        status: resendRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: "Notification processed successfully", htmlPreview: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
