"""Drive the Tenure prototype through its full reward loop and capture frames.

Runs against the Vite dev server on http://localhost:5173 using the system Edge
(no browser download). Writes numbered PNGs to docs/demo/frames/ which
build_gif.py then stitches into an animated demo.
"""
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173/"
OUT = Path(__file__).resolve().parent.parent / "docs" / "demo" / "frames"
OUT.mkdir(parents=True, exist_ok=True)

VW, VH = 1120, 860

frames = []


def shot(page, name, hold=1):
    """Capture a viewport frame. hold repeats it in the GIF to linger."""
    idx = len(frames)
    path = OUT / f"{idx:02d}-{name}.png"
    page.screenshot(path=str(path))
    frames.append((path, hold))
    print(f"  [{idx:02d}] {name} (hold {hold})")


def goto_hash(page, h):
    page.evaluate(f"window.location.hash = '{h}'")
    page.wait_for_timeout(650)


def click_text(page, text, exact=True):
    page.get_by_role("button", name=text, exact=exact).first.click()
    page.wait_for_timeout(500)


def click_link(page, text):
    page.get_by_role("link", name=text, exact=False).first.click()
    page.wait_for_timeout(650)


def switch_role(page, role):
    page.get_by_role("button", name=role, exact=True).first.click()
    page.wait_for_timeout(650)


with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="msedge", headless=True)
    ctx = browser.new_context(viewport={"width": VW, "height": VH}, device_scale_factor=1)
    page = ctx.new_page()

    # Fresh seed.
    page.goto(BASE, wait_until="networkidle")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(700)

    print("Capturing reward loop...")

    # 1. Volunteer home, before any action.
    goto_hash(page, "#/volunteer")
    shot(page, "home-before", hold=3)

    # 2. Discover opportunities.
    goto_hash(page, "#/volunteer/discover")
    shot(page, "discover", hold=3)

    # 3. Passport before: 3 of 4 shifts, no record yet.
    goto_hash(page, "#/volunteer/passport")
    shot(page, "passport-before", hold=3)

    # 4. Check-in page for the next shift.
    goto_hash(page, "#/volunteer")
    click_link(page, "Check in")
    shot(page, "checkin-registered", hold=2)

    # 5. Simulate arriving on-site (geofence).
    click_text(page, "Simulate arriving on-site")
    shot(page, "checkin-onsite", hold=2)

    # 6. Check out -> awaiting sign-off.
    click_text(page, "Check out and request sign-off")
    shot(page, "checkin-awaiting", hold=3)

    # 7. Switch to the org and open the sign-off queue.
    switch_role(page, "Organization")
    goto_hash(page, "#/org/signoff")
    shot(page, "org-signoff-queue", hold=3)

    # 8. Approve Maya's shift -> mints + crosses the threshold (toasts).
    page.get_by_role("button", name="Approve", exact=True).first.click()
    page.wait_for_timeout(500)  # let the "crossed" toast fire (300ms delay)
    shot(page, "org-approved-toast", hold=3)
    page.wait_for_timeout(300)

    # 9. Back as volunteer: record earned, credits vested.
    switch_role(page, "Volunteer")
    goto_hash(page, "#/volunteer")
    shot(page, "home-after", hold=3)

    # 10. Credits: spend the vested credits on a record-gated 1:1.
    goto_hash(page, "#/volunteer/credits")
    shot(page, "credits-before", hold=3)

    # Redeem the UX mentorship (unlocked now that she holds a record).
    cards = page.locator("main .rounded-2xl")
    n = cards.count()
    for i in range(n):
        c = cards.nth(i)
        if "1:1 with a UX lead" in c.inner_text():
            c.get_by_role("button", name="Redeem").first.click()
            break
    page.wait_for_timeout(600)
    shot(page, "credits-redeemed", hold=3)

    # 11. Passport after: Verified Service Record issued.
    goto_hash(page, "#/volunteer/passport")
    shot(page, "passport-after", hold=4)

    ctx.close()
    browser.close()

print(f"\nCaptured {len(frames)} frames to {OUT}")
# Record hold counts for the GIF builder.
(OUT / "holds.txt").write_text(
    "\n".join(f"{p.name}\t{h}" for p, h in frames), encoding="utf-8"
)
