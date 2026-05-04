# Triumph Homes Website Domain Cutover Checklist

## Before Cutover
- [ ] Confirm final site content approved
- [ ] Confirm form submissions arrive at Triumphhomes@yahoo.com
- [ ] Verify all page links, buttons, and image loads
- [ ] Verify mobile + desktop layout
- [ ] Keep old site available for rollback

## DNS + Hosting Prep
- [ ] Identify current DNS host (where nameservers/A/CNAME are managed)
- [ ] Collect current DNS records backup (A, CNAME, TXT, MX)
- [ ] Set low TTL (300s) on domain records 24h before cutover
- [ ] Add domain in new hosting provider and validate ownership
- [ ] Pre-provision SSL certificate on new host

## Cutover Steps
- [ ] Point apex/root domain to new host target
- [ ] Point `www` CNAME to new host target
- [ ] Keep email-related DNS records unchanged (MX/SPF/DKIM)
- [ ] Save and publish DNS changes

## Post-Cutover Validation
- [ ] Confirm HTTPS valid on root and www
- [ ] Confirm homepage, form submit, and review link work
- [ ] Confirm no mixed content/security warnings
- [ ] Confirm old URLs redirect correctly if needed
- [ ] Check from phone on cellular (not just local Wi-Fi)

## Rollback Plan
- [ ] Keep old DNS values ready for instant revert
- [ ] If critical issue appears, restore old A/CNAME records
- [ ] Re-test old site and communicate temporary rollback

## Recommended Go-Live Window
- [ ] Weekday, daytime, low-traffic window
- [ ] 30-60 minutes reserved for verification + fixes
