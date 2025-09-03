import browser from 'webextension-polyfill'

const injectScript = browser.runtime.getURL('inject.js')
const injectCSS = browser.runtime.getURL('debugger.css')

const link = document.createElement('link')
link.rel = 'stylesheet'
link.type = 'text/css'
link.href = injectCSS;
(document.head || document.documentElement).appendChild(link)

const s = document.createElement('script')
s.src = injectScript;
s.onload = function() {
    (this as HTMLScriptElement).remove();
};
(document.head || document.documentElement).appendChild(s)

document.addEventListener('bubbleAppDetected', (event: Event) => {
    const customEvent = event as CustomEvent;
    const domain = customEvent.detail.domain;
    
    browser.storage.local.get('bubbleDomains').then(result => {
        const domains = result.bubbleDomains as string[] || [];
        if (!domains.includes(domain)) {
            window.location.reload();
        }
    }).catch(error => {
        console.error('Error checking domain list:', error);
    });
    
    // Send message to background script
    browser.runtime.sendMessage({
        type: 'IS_BUBBLE_APP',
        domain: domain
    }).then(response => {
        const result = response as { success?: boolean; error?: string };
        if (result && result.success) {
            console.log('Successfully sent IS_BUBBLE_APP message for domain:', domain);
        } else {
            console.warn('IS_BUBBLE_APP message failed:', result?.error);
        }
    }).catch(error => {
        console.error('Failed to send IS_BUBBLE_APP message:', error);
    });
});
