import { z } from 'zod'

export const newsletterSchema = z.object({
  email: z.string().trim().min(1).email(),
  /**
   * GDPR Art. 7: consent must be an active opt-in, never pre-ticked.
   * Typed as `boolean` (not `z.literal(true)`) so the form can start unchecked
   * and still satisfy the resolver's input type.
   */
  consent: z.boolean().refine((v) => v === true, {
    message: 'Bitte stimmen Sie der Datenschutzerklärung zu.',
  }),
})

export type NewsletterInput = z.infer<typeof newsletterSchema>
