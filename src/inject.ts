import { EventEmitter } from 'eventemitter3';
import { BubbleInfo } from './types/interfaces';

document.addEventListener('DOMContentLoaded', (): void => {
    // get the html of the current page
    const pageHtml: string = document.documentElement.outerHTML;
    const rgx: RegExp = /if\s*\(!window\._bubble_page_load_data\)/;
    const match: RegExpMatchArray | null = pageHtml.match(rgx);

    if (match) {
        console.log('bubble-pwn: we\'re on a bubble app')

        // Send message to content script that this is a bubble app
        const domain: string = window.location.hostname;
        const bubbleAppEvent: CustomEvent<{ domain: string }> = new CustomEvent('bubbleAppDetected', {
            detail: { domain: domain }
        });
        document.dispatchEvent(bubbleAppEvent);

        if (window.start_debugger) {
            console.log('bubble-pwn: starting debugger');
            window.start_debugger();
        } else {
            console.warn('bubble-pwn: start_debugger not found');
        }

        const eventEmitter: EventEmitter<string | symbol, any> = new EventEmitter<string | symbol, any>();
        window.bubblePWN = window.bubblePWN || {};
        window.bubblePWN.event = {
            on: eventEmitter.on.bind(eventEmitter),
            off: eventEmitter.off.bind(eventEmitter),
            emit: eventEmitter.emit.bind(eventEmitter)
        };

        const appInfo: BubbleInfo = {
            appPlan: window.bubblePWN.lib_default().app_plan(),
            appName: window.bubblePWN.lib_default().appname(),
            appLanguage: window.bubblePWN.lib_default().app_language(),
            bubbleVersion: window.bubblePWN.lib_default().bubble_version()
        };

        const appInfoEvent: CustomEvent<{ domain: string; info: BubbleInfo }> = new CustomEvent('bubbleAppInfo', {
            detail: { domain, info: appInfo }
        });
        document.dispatchEvent(appInfoEvent);

        window.bubblePWN.event.emit('app_info', { 
            domain,
            info: appInfo
        });
    }
})