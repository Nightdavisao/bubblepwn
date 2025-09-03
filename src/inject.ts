import { EventEmitter } from 'eventemitter3';
import { html, render } from 'lighterhtml'

document.addEventListener('DOMContentLoaded', () => {
    // get the html of the current page
    const pageHtml = document.documentElement.outerHTML;
    const rgx = /if\s*\(!window\._bubble_page_load_data\)/;
    const match = pageHtml.match(rgx);

    if (match) {
        console.log('bubble-pwn: we\'re on a bubble app')

        // Send message to content script that this is a bubble app
        const domain = window.location.hostname;
        const bubbleAppEvent = new CustomEvent('bubbleAppDetected', {
            detail: { domain: domain }
        });
        document.dispatchEvent(bubbleAppEvent);

        if (window.start_debugger) {
            window.start_debugger();
        }

        const eventEmitter = new EventEmitter<string | symbol, any>();
        window.bubblePWN = window.bubblePWN || {};
        window.bubblePWN.event = {
            on: eventEmitter.on.bind(eventEmitter),
            off: eventEmitter.off.bind(eventEmitter),
            emit: eventEmitter.emit.bind(eventEmitter)
        };

        // we're on a bubble app
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'background-color: black; color: white; position: fixed; bottom: 0px; right: 0px; border: none; z-index: 99999;';
        document.body.appendChild(iframe);

        iframe.onload = () => {
            const doc = iframe.contentDocument;
            if (doc) {
                doc.open();
                const savedQueries: any[] = []

                window.bubblePWN.event.on('db_query', (query: any) => {
                    savedQueries.push(query);
                    renderPwn();
                });
                const renderPwn = () => {
                    const component = () => html`
                        <div style="color: white;">
                            <span>DB queries</span>
                            <pre>
                                ${[...savedQueries].reverse().map(query => html`<li>${JSON.stringify(query, null, 2)}</li>`)}
                            </pre>
                        </div>
                    `;
                    render(doc.body, component);
                }
                //renderPwn();
                doc.close();
            }
        };
    }
})