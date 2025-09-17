import browser from "webextension-polyfill";
import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import { getBubbleAppInfo, isCurrentTabBubbleApp } from "./utils/util";
import { BubbleInfo } from "./bubblepwn";

type PopupTab = 'datatypes' | 'database' | 'info';

function Popup() {
    const [currentTab, setCurrentTab] = useState<PopupTab>('info');
    const [bubbleAppData, setBubbleAppData] = useState<BubbleInfo | null>(null);

    useEffect(() => {
        async function checkBubbleApp() {
            const currentTab = await browser.tabs.query({ active: true, currentWindow: true });
            if (currentTab.length === 0) return setBubbleAppData(null);

            const check = await isCurrentTabBubbleApp();
            if (!check) return setBubbleAppData(null);

            const url = new URL(currentTab[0].url || '');
            const domain = url.hostname

            const data = await getBubbleAppInfo(domain);

            setBubbleAppData(data);
        }
        checkBubbleApp();
    }, []);

    return (
        <>
            <div class="tabs">
                <button
                    type="button"
                    class={currentTab === 'info' ? 'active' : ''}
                    onClick={() => setCurrentTab('info')}
                >
                    info
                </button>
                <button
                    type="button"
                    class={currentTab === 'database' ? 'active' : ''}
                    onClick={() => setCurrentTab('database')}
                >
                    database
                </button>
                <button
                    type="button"
                    class={currentTab === 'datatypes' ? 'active' : ''}
                    onClick={() => setCurrentTab('datatypes')}
                >
                    datatypes
                </button>
            </div>
            <div class="content">
                {currentTab === 'info' && (
                    <div>
                        {bubbleAppData === null ? (
                            <p>not a bubble app</p>
                        ) : (
                            <>
                                <p><strong>app name:</strong> {bubbleAppData.appName}</p>
                                <p><strong>app plan:</strong> <span style={{ wordBreak: 'break-word' }}>{JSON.stringify(bubbleAppData.appPlan)}</span></p>
                                <p><strong>app language:</strong> {bubbleAppData.appLanguage}</p>
                                <p><strong>bubble version:</strong> {bubbleAppData.bubbleVersion}</p>
                            </>
                        )}
                    </div>
                )}
                {currentTab === 'database' && (
                    <div>
                        <p>databases</p>
                    </div>
                )}
                {currentTab === 'datatypes' && (
                    <div>
                        <p>datatypes</p>
                    </div>
                )}
            </div>
        </>
    );
}

const container = document.getElementById('container');
if (container) {
    render(<Popup />, container);
}