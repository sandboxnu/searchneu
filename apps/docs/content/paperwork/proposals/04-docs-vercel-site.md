---
title: 04 - Docs Vercel Site
---

This PCP establishes hosting for the SearchNEU documentation site as a separate
Vercel project accessible at `docs.searchneu.com`.

## WHY

The docs site (`apps/docs`) is a separate application in the monorepo that currently
has no production deployment. Hosting it separately from the main SearchNEU app
provides:

- A public home for contributor documentation, PCPs, and incident post-mortems
- Clear separation of concerns—docs deploys don't affect the main site and vice
  versa
- Dedicated preview deployments for documentation changes

Using Vercel keeps our infrastructure consistent and simple. A subdomain makes the
docs easily discoverable and clearly associated with SearchNEU.

## WHAT

### Infrastructure Changes

| Resource | Change                                           |
| -------- | ------------------------------------------------ |
| Vercel   | New project searchneu-docs linked to `apps/docs` |
| DNS      | New CNAME record docs.searchneu.com → Vercel     |

### Vercel Project Configuration

- **Framework Preset:** Next.js (Fumadocs)
- **Root Directory:** `apps/docs`
- **Build Command:** `pnpm run build`
- **Output Directory:** Framework default
- **Install Command:** Use monorepo root install

### DNS Configuration

| Type  | Name | Value                      | TTL  | Proxy    |
| ----- | ---- | -------------------------- | ---- | -------- |
| CNAME | docs | \<Vercel generated CNAME\> | auto | DNS Only |

Will be configured via ClickOps in the Cloudflare Dashboard

### Environment Variables

None required for initial deployment. If added later, they should be documented
in the docs app README.

## IMPLEMENTATION STEPS

1. Create Vercel Project
   - Create new project, link to the SearchNEU monorepo
   - Set root directory to `apps/docs`
   - Configure framework settings as specified above
   - Deploy to verify build works

2. Configure Domain
   - In Vercel project settings, go to Domains
   - Add `docs.searchneu.com`
   - Vercel will provide DNS configuration instructions

3. Update DNS
   - Log into DNS provider (Cloudflare)
   - Add CNAME record as specified above
   - Ensure proxy is set with DNS only

4. Verify
   - Wait for DNS propagation
   - Verify `docs.searchneu.com` loads correctly
   - Verify HTTPS certificate is issued
   - Test a preview deployment on a docs PR

5. Update Documentation
   - Add the docs URL to the main README
   - Update any internal references to docs

## ROLLBACK STEPS

### If build fails on Vercel

- Check build logs for errors
- Fix in a PR to `apps/docs`
- Redeploy

### If DNS is misconfigured

- Remove or correct the CNAME record in DNS provider
- Remove domain from Vercel project settings if needed
- DNS will revert once TTL expires (up to 1 hour with TTL 3600)

### Full rollback

- Delete the Vercel project (or disconnect from repo)
- Remove CNAME record from DNS
- The subdomain will stop resolving; main site is unaffected

Since this is a new deployment with no existing users, rollback risk is minimal.
The main SearchNEU site is completely unaffected by this change.

## APPENDIX

- [Vercel Monorepo Documentation](https://vercel.com/docs/monorepos)
- [Vercel Custom Domains](https://vercel.com/docs/projects/domains)
- [Cloudflare](https://www.cloudflare.com/)
- [Vercel](https://vercel.com/sandboxneu)
