from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")
        page.wait_for_selector(".chat-header", timeout=5000)
        page.screenshot(path="verification/frontend.png")
        print("Screenshot taken")
        browser.close()

if __name__ == "__main__":
    run()
