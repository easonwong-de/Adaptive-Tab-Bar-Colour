#!/usr/bin/env node
/**
 * Integration Tests for Adaptive Tab Bar Colour
 *
 * Usage:
 *   node test.cjs
 *
 * Requires: geckodriver, selenium-webdriver, selenium-webext-bridge
 */

const path = require('path');
const http = require('http');
const {
  launchBrowser, cleanupBrowser,
  sleep, TestResults, Command
} = require('selenium-webext-bridge');

const EXT_DIR = path.join(__dirname, 'src');
const EXT_ID = 'ATBC@EasonWong';

/**
 * Serves pages with specific background colors.
 * Example: /test-page?bg=%23ff0000
 */
function createColorServer(port = 8080) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      const bg = url.searchParams.get('bg') || '#f0f0f0';
      const name = url.pathname.slice(1) || 'test';

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${name}</title></head>
<body style="margin:0; padding:0; background:${bg}; min-height:100vh;">
  <div id="keepalive"></div>
  <script>
    setInterval(() => {
      document.getElementById('keepalive').textContent = Date.now();
    }, 5000);
  </script>
</body>
</html>`);
    });

    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      console.log(`Color test server on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

/**
 * Reads the browser frame's accent color from Firefox chrome context.
 */
async function getFrameColor(driver) {
  await driver.execute(
    new Command('setContext').setParameter('context', 'chrome')
  );
  try {
    return await driver.executeScript(() => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue('--lwt-accent-color').trim() || null;
    });
  } finally {
    await driver.execute(
      new Command('setContext').setParameter('context', 'content')
    );
  }
}

/**
 * Parses an rgba/rgb color string.
 */
function parseRGB(str) {
  if (!str) { return null; }
  const match = str.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  return match ? { r: +match[1], g: +match[2], b: +match[3] } : null;
}

/**
 * Checks if two color strings are different with tolerance value.
 */
function colorsDiffer(a, b, tolerance = 5) {
  const ca = parseRGB(a), cb = parseRGB(b);
  if (!ca || !cb) { return true; } // can't compare, treat as different
  return Math.abs(ca.r - cb.r) > tolerance ||
         Math.abs(ca.g - cb.g) > tolerance ||
         Math.abs(ca.b - cb.b) > tolerance;
}

async function main() {
  console.log('=== Integration Tests ===');

  const results = new TestResults();
  const server = await createColorServer();
  let browser;

  try {
    console.log('Setting up Firefox');
    browser = await launchBrowser({
      extensions: [EXT_DIR],
      firefoxArgs: ['-remote-allow-system-access']
    });
    const { driver, testBridge: bridge } = browser;
    console.log('Setup complete.\n');

    console.log('----- Setup -----');

    let extBaseUrl;
    try {
      extBaseUrl = await bridge.getExtensionUrl(EXT_ID);
      if (extBaseUrl && extBaseUrl.startsWith('moz-extension://')) {
        results.pass('Get Extension URL');
      } else {
        results.fail('Get Extension URL', `got: ${extBaseUrl}`);
      }
    } catch (e) {
      results.error('Get Extension URL', e);
    }

    if (!extBaseUrl) {
      throw new Error('Could not get extension URL');
    }

    const optionsUrl = `${extBaseUrl}/options/options.html`;
    const popupUrl = `${extBaseUrl}/popup/popup.html`;

    console.log('----- Apply Themes -----');

    // Navigate to a white page.
    await bridge.reset();
    await driver.get('http://127.0.0.1:8080/white?bg=%23ffffff');
    await sleep(2000);

    let whiteFrame;
    try {
      whiteFrame = await getFrameColor(driver);
      if (whiteFrame) {
        results.pass(`Applies a frame color on page load (${whiteFrame})`);
      } else {
        results.fail('Applies a frame color on page load',
          'no --lwt-accent-color set');
      }
    } catch (e) {
      results.error('Applies a frame color on page load', e); 
    }

    // Navigate to a colored page.
    await driver.get('http://127.0.0.1:8080/blue?bg=%23aaccff');
    await sleep(2000);

    try {
      const blueFrame = await getFrameColor(driver);
      if (whiteFrame && blueFrame && colorsDiffer(whiteFrame, blueFrame)) {
        results.pass(`Different page produces different frame color (${blueFrame})`);
      } else {
        results.fail('Different page produces different frame color',
          `white: ${whiteFrame}, blue: ${blueFrame}`);
      }
    } catch (e) {
      results.error('Different page produces different frame color', e);
    }

    console.log('----- Options Page -----');

    await driver.get(optionsUrl);
    await sleep(1500);

    try {
      const tabCount = await driver.executeScript(() => {
        return document.querySelectorAll('.tab-switch-wrapper input[name="tab-switch"]').length;
      });
      if (tabCount === 3) {
        results.pass('Options page loads with three tabs');
      } else {
        results.fail('Options page loads with three tabs', `found ${tabCount}`);
      }
    } catch (e) {
      results.error('Options page loads with three tabs', e);
    }

    try {
      const sliderPrefs = await driver.executeScript(() => {
        const sliders = document.querySelectorAll('#tab-1 .slider[data-pref]');
        return Array.from(sliders).map(s => s.dataset.pref);
      });
      const expected = [
        'tabSelected', 'tabSelectedBorder', 'tabbar', 'tabbarBorder',
        'popup', 'popupBorder', 'toolbarField', 'toolbarFieldOnFocus',
        'toolbarFieldBorder', 'toolbar', 'toolbarBorder', 'sidebar', 'sidebarBorder'
      ];
      const hasAll = expected.every(p => sliderPrefs.includes(p));
      if (hasAll) {
        results.pass('All theme sliders found');
      } else {
        results.fail('All theme sliders found',
          `missing: ${expected.filter(p => !sliderPrefs.includes(p)).join(', ')}`);
      }
    } catch (e) {
      results.error('All theme sliders found', e);
    }

    console.log('----- Default Preferences -----');

    try {
      const prefs = await driver.executeScript(async () => {
        return await browser.storage.local.get();
      });

      if (prefs.dynamic === true) {
        results.pass('Dynamic mode defaults to enabled');
      } else {
        results.fail('Dynamic mode defaults to enabled',
          `dynamic: ${prefs.dynamic}`);
      }

      if (prefs.allowDarkLight === true) {
        results.pass('Allow dark/light enabled by default');
      } else {
        results.fail('Allow dark/light enabled by default',
          `allowDarkLight: ${prefs.allowDarkLight}`);
      }

      if (prefs.tabbar === 0 && prefs.toolbar === 0) {
        results.pass('Sliders default to zero');
      } else {
        results.fail('Sliders default to zero',
          `tabbar: ${prefs.tabbar}, toolbar: ${prefs.toolbar}`);
      }
    } catch (e) {
      results.error('Settings defaults', e);
    }

    console.log('----- Advanced Settings -----');

    await driver.executeScript(() => {
      document.getElementById('tab-switch-3').click();
    });
    await sleep(500);

    try {
      const checkboxPrefs = await driver.executeScript(() => {
        const cbs = document.querySelectorAll('#tab-3 input[type="checkbox"][data-pref]');
        return Array.from(cbs).map(cb => cb.dataset.pref);
      });
      const expected = ['allowDarkLight', 'dynamic', 'noThemeColour', 'compatibilityMode'];
      const hasAll = expected.every(p => checkboxPrefs.includes(p));
      if (hasAll) {
        results.pass('Advanced tab has all 4 setting checkboxes');
      } else {
        results.fail('Advanced tab has all 4 setting checkboxes',
          `found: ${checkboxPrefs.join(', ')}`);
      }
    } catch (e) { results.error('Advanced tab has all 4 setting checkboxes', e); }

    try {
      const colorPrefs = await driver.executeScript(() => {
        const wrappers = document.querySelectorAll('#tab-3 .colour-input-wrapper[data-pref]');
        return Array.from(wrappers).map(w => w.dataset.pref);
      });
      const expected = [
        'homeBackground_light', 'homeBackground_dark',
        'fallbackColour_light', 'fallbackColour_dark'
      ];
      const hasAll = expected.every(p => colorPrefs.includes(p));
      if (hasAll) {
        results.pass('Advanced tab color inputs: home and fallback');
      } else {
        results.fail('Advanced tab color inputs: home and fallback',
          `found: ${colorPrefs.join(', ')}`);
      }
    } catch (e) {
      results.error('Advanced tab color inputs: home and fallback', e);
    }

    console.log('----- Preference Persistence -----');

    try {
      const original = await driver.executeScript(async () => {
        const data = await browser.storage.local.get('tabbar');
        return data.tabbar;
      });

      await driver.executeScript(async () => {
        await browser.storage.local.set({ tabbar: 25 });
      });

      await driver.get(optionsUrl);
      await sleep(1500);

      const stored = await driver.executeScript(async () => {
        const data = await browser.storage.local.get('tabbar');
        return data.tabbar;
      });

      if (stored === 25) {
        results.pass('Preference persistence');
      } else {
        results.fail('Preference persistence', `got: ${stored}`);
      }

      // Restore preferences.
      await driver.executeScript(async (val) => {
        await browser.storage.local.set({ tabbar: val });
      }, original);
    } catch (e) {
      results.error('Preference persistence', e);
    }
  } catch (e) {
    results.error('Test Suite', e);
  } finally {
    await cleanupBrowser(browser);
    server.close();
  }

  console.log('');
  results.summary();
  process.exit(results.exitCode());
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
