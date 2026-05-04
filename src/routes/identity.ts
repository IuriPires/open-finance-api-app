import { Router } from 'express';
import { pluggy } from '../pluggy-client.js';

export const identityRouter = Router();

function formatCpf(doc: string | null): string | null {
  if (!doc) return null;
  const digits = doc.replace(/\D/g, '');
  if (digits.length !== 11) return doc;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

identityRouter.get('/items/:id/identity', async (req, res, next) => {
  try {
    const identity = await pluggy.fetchIdentityByItemId(req.params.id);

    res.json({
      fullName: identity.fullName,
      document: formatCpf(identity.document),
      documentType: identity.documentType,
      birthDate: identity.birthDate,
      jobTitle: identity.jobTitle,
      emails: (identity.emails ?? []).map((e) => ({ value: e.value, type: e.type ?? null })),
      phones: (identity.phoneNumbers ?? []).map((p) => ({
        value: p.value,
        type: p.type ?? null,
      })),
      addresses: (identity.addresses ?? []).map((a) => ({
        fullAddress: a.fullAddress ?? null,
        primaryAddress: a.primaryAddress ?? null,
        city: a.city ?? null,
        state: a.state ?? null,
        postalCode: a.postalCode ?? null,
        country: a.country ?? null,
        type: a.type ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
});
