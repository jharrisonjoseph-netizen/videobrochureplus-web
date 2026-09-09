Video Brochure Plus B2B Website

The public site is a static Vercel project. The canonical production origin is:
https://www.videobrochureplus.com/

Core content includes seven product pages, screen-size/cost/sample guides,
artwork guidance, the manufacturing workflow and an About page. Vercel clean
URLs remove .html extensions and the sitemap contains canonical URLs only.

The two homepage inquiry forms use the site's existing Web3Forms access key.
No live form submission is run by the repository checks.

Local validation:
node build-site.mjs
python3 tests/site_quality.py
node tests/forms.mjs

After production deployment, verify /index.html redirects to /, resubmit
sitemap.xml in Google Search Console, and use URL Inspection on the canonical
homepage and core product pages.
