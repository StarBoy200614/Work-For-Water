module.exports = async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Only POST requests are accepted.' });
    }

    try {
        const { name, email, subject, message, website } = req.body;

        // Honeypot check for bots (Spam Protection)
        if (website) {
            console.warn('Bot submission intercepted on backend via honeypot.');
            return res.status(200).json({ message: 'Thank you! Your message has been sent successfully.' });
        }

        // Validation checks
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields (name, email, subject, message) are required.' });
        }

        // Email address formatting check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address.' });
        }

        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error('RESEND_API_KEY environment variable is not defined.');
            return res.status(500).json({ error: 'Mail server configuration error. Please try again later.' });
        }

        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const toEmail = process.env.RESEND_TO_EMAIL || 'mansee.bal.bhargava@gmail.com';

        // Prepare Resend email payload
        const emailPayload = {
            from: fromEmail,
            to: toEmail,
            subject: `Portfolio Contact: ${subject}`,
            reply_to: email,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="background-color: #061e38; padding: 20px; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 20px; font-weight: normal;">New Contact Form Message</h2>
                    </div>
                    <div style="padding: 24px; background-color: #ffffff;">
                        <p style="margin-top: 0;">You have received a new message from your portfolio contact form:</p>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; width: 100px; border-bottom: 1px solid #f4f4f5;">Name:</td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f4f4f5;">Email:</td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5;"><a href="mailto:${email}">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f4f4f5;">Subject:</td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5;">${subject}</td>
                            </tr>
                        </table>
                        <p style="font-weight: bold; margin-bottom: 8px;">Message:</p>
                        <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; border: 1px solid #e4e4e7; white-space: pre-wrap;">${message}</div>
                    </div>
                    <div style="background-color: #f4f4f5; padding: 12px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7;">
                        Sent from Portfolio Contact Page. You can reply directly to this email to contact the sender.
                    </div>
                </div>
            `
        };

        // Call Resend REST API
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailPayload)
        });

        const resendData = await resendResponse.json();

        if (!resendResponse.ok) {
            console.error('Resend API error:', resendData);
            return res.status(resendResponse.status).json({ error: resendData.message || 'Error sending email via Resend API.' });
        }

        return res.status(200).json({ message: 'Thank you! Your message has been sent successfully.' });

    } catch (error) {
        console.error('Serverless function error:', error);
        return res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
}
