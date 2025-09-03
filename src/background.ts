import browser from 'webextension-polyfill'
import { PatchInstrumentation } from './modding/instrument';
import { DatabasePatch } from './modding/patches/database';
import { DebugPatch } from './modding/patches/debugMode';
import { ExposeVariablesPatch } from './modding/patches/exposeVariables';

const allowedBubbleDomains: string[] = ['bubble.io']

// get allowed bubble domains from storage
browser.storage.local.get('bubbleDomains').then((result: { bubbleDomains?: string[] }) => {
    const apps = result.bubbleDomains || [];
    allowedBubbleDomains.push(...apps);
});

browser.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
    if (message.type === 'IS_BUBBLE_APP') {
        console.log('bubble-pwn: detected bubble app at ' + message.domain);
        const domain = message.domain

        if (domain) {
            (async () => {
                try {
                    const result: { bubbleDomains?: string[] } = await browser.storage.local.get('bubbleDomains');
                    const apps: string[] = result.bubbleDomains || [];
                    if (!apps.includes(domain)) {
                        apps.push(domain);
                        await browser.storage.local.set({ bubbleDomains: apps });
                        console.log('bubble-pwn: added domain to storage:', domain);
                    }
                    sendResponse({ success: true });
                } catch (error) {
                    console.error('Error handling IS_BUBBLE_APP message:', error);
                    sendResponse({ success: false, error: String(error) });
                }
            })();
            return true;
        }
    }
    return true;
});

browser.storage.onChanged.addListener((changes: Record<string, browser.Storage.StorageChange>, area: string) => {
    if (area === 'local' && changes.bubbleDomains) {
        const newValue = changes.bubbleDomains.newValue as string[];
        allowedBubbleDomains.push(...newValue);
    }
});

browser.webRequest.onBeforeRequest.addListener((details) => {
    const url = new URL(details.url);
    const domain = url.hostname;

    if (allowedBubbleDomains.includes(domain)) {
        console.log('manipulating ' + domain)
        if (url.pathname.match(/\/package\/run_css\/[a-f0-9]{64}\/.*\/live\/.*/)) {
            return { redirectUrl: url.toString().replace('/live/', '/test/').replace(/\/xfalse\/(?=[^\/]*$)/, '/xtrue/') };
        }

        if (url.pathname.match(/\/package\/run_js\/[a-f0-9]{64}\/xfalse\/x\d+\/run\.js/)) {
            return { redirectUrl: url.toString().replace('/run_js/', '/run_debug_js/') };
        } else if (url.pathname.match(/\/package\/run_debug_js\/[a-f0-9]{64}\/xfalse\/x\d+\/run\.js/)) {
            const filter = browser.webRequest.filterResponseData(details.requestId);
            const decoder = new TextDecoder("utf-8");
            const encoder = new TextEncoder()

            const chunks: (AllowSharedBufferSource | undefined)[] = []
            filter.ondata = (e) => chunks.push(e.data)

            filter.onstop = () => {
                let text = ""
                for (let i = 0; i < chunks.length; i++) {
                    text += decoder.decode(chunks[i], { stream: i < chunks.length - 1 })
                }
                text += decoder.decode();

                try {
                    const instrumentation = new PatchInstrumentation(text)
                    instrumentation.addPatch(new DatabasePatch())
                    instrumentation.addPatch(new DebugPatch())
                    instrumentation.addPatch(new ExposeVariablesPatch())
                    const modified = instrumentation.applyPatches()
                    const modifiedChunks = encoder.encode(modified);
                    filter.write(modifiedChunks);
                    filter.close();
                } catch (e) {
                    console.error("Failed to apply patches:", e);
                    filter.write(encoder.encode(text));
                    filter.close();
                }
            }
        }
    }

}, { urls: ["<all_urls>"] }, ["blocking"]);