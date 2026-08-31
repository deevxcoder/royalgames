import nodemailer from "nodemailer";

export interface WelcomeEmailData {
  to: string;
  companyName: string;
  password?: string;
  token: string;
  secretKey: string;
  callbackUrl?: string;
  portalUrl?: string;
}

export async function sendClientWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string; notConfigured?: boolean }> {
  const { to, companyName, password, token, secretKey, callbackUrl, portalUrl } = data;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"Royal Games Studio" <no-reply@royalgames.com>`;

  const resolvedPortalUrl = portalUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002/portal/login";

  // If SMTP is not set up, gracefully log to console and report notConfigured
  if (!host || !user || !pass) {
    console.log("ℹ️ [EMAIL SERVICE] SMTP not configured. Account created email preview for:", to);
    console.log(`- Company: ${companyName}`);
    console.log(`- Email: ${to}`);
    console.log(`- Password: ${password || "[unchanged]"}`);
    console.log(`- API Token: ${token}`);
    console.log(`- Secret Key: ${secretKey}`);
    return {
      success: false,
      notConfigured: true,
      error: "SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not configured in .env",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Royal Games Studio</title>
  <style>
    body { margin:0; padding:0; background-color:#05070d; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f1f5f9; }
    .wrapper { max-width:600px; margin:0 auto; padding:30px 20px; }
    .card { background-color:#0b0f19; border:1px solid #1e293b; border-radius:16px; padding:32px; box-shadow:0 20px 40px rgba(0,0,0,0.5); }
    .header { text-align:center; padding-bottom:24px; border-bottom:1px solid #1e293b; }
    .logo { font-size:22px; font-weight:900; color:#fbbf24; letter-spacing:1px; }
    .badge { display:inline-block; padding:4px 12px; background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.3); border-radius:20px; color:#fbbf24; font-size:11px; font-weight:bold; margin-top:8px; }
    .title { font-size:20px; font-weight:800; color:#ffffff; margin:24px 0 8px 0; text-align:center; }
    .subtitle { font-size:13px; color:#94a3b8; text-align:center; line-height:1.5; margin-bottom:24px; }
    .section-title { font-size:12px; font-weight:700; color:#fbbf24; text-transform:uppercase; letter-spacing:0.5px; margin:20px 0 10px 0; }
    .box { background-color:#06080e; border:1px solid #1e293b; border-radius:12px; padding:16px; margin-bottom:16px; }
    .row { display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; }
    .label { color:#64748b; font-weight:600; }
    .value { color:#ffffff; font-weight:700; font-family:monospace; word-break:break-all; }
    .highlight { color:#34d399; }
    .btn { display:block; width:100%; text-align:center; background:linear-gradient(135deg, #f59e0b, #d97706); color:#000000; font-weight:800; font-size:14px; padding:12px 0; border-radius:10px; text-decoration:none; margin:24px 0; }
    .footer { text-align:center; font-size:11px; color:#64748b; margin-top:24px; line-height:1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">👑 ROYAL GAMES STUDIO</div>
        <div class="badge">B2B OPERATOR INTEGRATION</div>
      </div>

      <div class="title">Account Created Successfully!</div>
      <div class="subtitle">
        Welcome <strong>${companyName}</strong>. Your B2B partner account has been created on the Royal Games Studio Remote Gaming Server (RGS).
      </div>

      <div class="section-title">🔑 Operator Portal Login</div>
      <div class="box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:13px;">
          <tr>
            <td style="color:#64748b; width:35%;"><strong>Login Portal:</strong></td>
            <td><a href="${resolvedPortalUrl}" style="color:#38bdf8; text-decoration:none;">${resolvedPortalUrl}</a></td>
          </tr>
          <tr>
            <td style="color:#64748b;"><strong>Username / Email:</strong></td>
            <td style="color:#ffffff; font-family:monospace;"><strong>${to}</strong></td>
          </tr>
          ${
            password
              ? `<tr>
            <td style="color:#64748b;"><strong>Password:</strong></td>
            <td style="color:#34d399; font-family:monospace;"><strong>${password}</strong></td>
          </tr>`
              : ""
          }
        </table>
      </div>

      <div class="section-title">⚡ Production API Credentials</div>
      <div class="box">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size:12px;">
          <tr>
            <td style="color:#64748b; width:35%;"><strong>API Token:</strong></td>
            <td style="color:#fbbf24; font-family:monospace; word-break:break-all;">${token}</td>
          </tr>
          <tr>
            <td style="color:#64748b;"><strong>Secret Key:</strong></td>
            <td style="color:#34d399; font-family:monospace; word-break:break-all;">${secretKey}</td>
          </tr>
          ${
            callbackUrl
              ? `<tr>
            <td style="color:#64748b;"><strong>Callback URL:</strong></td>
            <td style="color:#cbd5e1; font-family:monospace; word-break:break-all;">${callbackUrl}</td>
          </tr>`
              : ""
          }
        </table>
      </div>

      <a href="${resolvedPortalUrl}" class="btn">Login to Operator Dashboard →</a>

      <div class="footer">
        <p>🔒 Please store your Secret Key securely. Never share your secret credentials in public client-side applications.</p>
        <p>© ${new Date().getFullYear()} Royal Games Studio. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from,
      to,
      subject: `👑 Welcome to Royal Games Studio — Your Operator Credentials for ${companyName}`,
      html: htmlContent,
    });

    console.log("✅ [EMAIL SERVICE] Welcome email sent successfully:", info.messageId);
    return { success: true };
  } catch (err: any) {
    console.error("❌ [EMAIL SERVICE] Error sending email:", err);
    return { success: false, error: err.message };
  }
}
