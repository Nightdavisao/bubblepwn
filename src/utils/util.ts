import { BubbleInfo } from "src/bubblepwn";
import browser from "webextension-polyfill";

export async function isCurrentTabBubbleApp() {
    const detectedBubbleApps = await browser.storage.local.get('bubbleDomains');
    const currentTab = await browser.tabs.query({ active: true, currentWindow: true });
    if (currentTab.length === 0) return false;

    const url = new URL(currentTab[0].url || '');
    const domain = url.hostname;
    
    const bubbleDomains = detectedBubbleApps.bubbleDomains as string[] || [];
    return bubbleDomains.includes(domain);
}

export async function getBubbleAppInfo(domain: string) {
    const data = await browser.storage.local.get('bubbleAppInfo');
    console.log('Retrieved bubbleAppInfo from storage:', data);
    const bubbleAppInfo = (data.bubbleAppInfo as Record<string, BubbleInfo>) || {};
    return bubbleAppInfo[domain] || {};
}