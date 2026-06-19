import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate.js'
import { config } from '../config/index.js'
import { getEmailProvider } from '../providers/index.js'

export const contactRouter = Router()

const contactSchema = z.object({
  name:     z.string().min(1).max(120),
  company:  z.string().min(1).max(120),
  email:    z.string().email(),
  teamSize: z.string().optional(),
  message:  z.string().max(2000).optional(),
})

contactRouter.post('/', validate({ body: contactSchema }), async (req, res) => {
  const { name, company, email, teamSize, message } = req.body as z.infer<typeof contactSchema>
  const mailer = getEmailProvider()
  const salesEmail = config.email.replyTo ?? 'sales@hivora.com'

  try {
    await mailer.send({
      to:      salesEmail,
      subject: `[Contact] ${company} — ${name}`,
      text:    `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nTeam: ${teamSize ?? 'N/A'}\n\n${message ?? ''}`,
      html:    `<p><strong>Name:</strong> ${name}</p><p><strong>Company:</strong> ${company}</p><p><strong>Email:</strong> ${email}</p><p><strong>Team Size:</strong> ${teamSize ?? 'Not specified'}</p><p><strong>Message:</strong></p><p>${(message ?? '').replace(/\n/g, '<br>')}</p>`,
    })

    await mailer.send({
      to:      email,
      subject: `Thanks for reaching out, ${name}!`,
      text:    `Hi ${name},\n\nThanks for contacting Hivora! We'll get back to you within 24 hours.\n\n— The Hivora Team`,
      html:    `<p>Hi ${name},</p><p>Thanks for contacting Hivora! We received your message and will get back to you within 24 hours.</p><p>In the meantime, explore our platform at <a href="${config.appUrl}">${config.appUrl}</a>.</p><p>— The Hivora Team</p>`,
    })
  } catch (err) {
    console.error('[contact] email error', err)
  }

  res.json({ success: true })
})
