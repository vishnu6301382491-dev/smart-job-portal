const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) {
    return { sent: false, reason: "missing_recipient" };
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Email delivery failed with status ${response.status}${body ? `: ${body}` : ""}`);
    }

    return { sent: true, provider: "resend" };
  }

  console.log(`[email:${to}] ${subject}`);
  return { sent: false, provider: "console" };
};

export default sendEmail;
