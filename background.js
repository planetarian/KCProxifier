
const self = this;

self.loadSettings = function () {
    try {
        const data = {};
        data.proxyHost = window.localStorage.getItem('proxyHost');
        data.proxyPort = window.localStorage.getItem('proxyPort');
        data.proxyEnable = window.localStorage.getItem('proxyEnable');
        data.proxyMode = window.localStorage.getItem('proxyMode');
        return data;
    }
    catch (error) {
        console.error(`Error occurred while loading saved proxy self.settings.\n${error}`);
        return { _error_: error };
    }
};

self.applyProxy = async function () {
    self.settings = self.loadSettings();
    const enable = self.settings.proxyEnable === "true";
    
    if (enable && self.settings.proxyMode === 'https-mitm') {
        const pacScript = self.generatePac(self.settings.proxyHost, self.settings.proxyPort);
        await chrome.proxy.settings.set(
            { value: { mode: "pac_script", pacScript: { data: pacScript } }, scope: 'regular' },
            () => console.log("Applied proxy settings with PAC script.", pacScript)
        );
    } else {
        await chrome.proxy.settings.clear(
            { scope: 'regular' },
            () => console.log("Cleared proxy settings.")
        );
    }

    const iconPath = '/assets/icons/KCProxifier_' + (enable ? 'green' : 'blue') + '_32.png';
    chrome.browserAction.setIcon({ path: iconPath });
};

self.generatePac = function (host, port) {
    // server letters, will expand to '00g|01y|02k' etc
    const servers = 'gyksmotlrsbtpbhpskish'
    const serversExp = [...servers].map((c, i) => String(i).padStart(2, '0') + c).join('|')

    const pac =
        'function FindProxyForURL(url, host) {\n' +
        `  if (new RegExp("w(${serversExp})\\.kancolle-server\\.com").test(host))\n` +
        `    return "PROXY ${host}:${port}";\n` +
        '  return "DIRECT";\n' +
        '}\n'

    return pac
}

chrome.webRequest.onBeforeRequest.addListener((details) => {
    if (!self.enable || self.settings.proxyMode === 'https-mitm' || details.method !== 'GET' || details.url.includes('/kcscontents/news'))
        return;

    const url = new URL(details.url);
    console.log("HTTPS:", url.href);

    if (!url.hostname.startsWith('w00'))
        self.serverHost = url.hostname

    let redirectUrl = `http://${self.settings.proxyHost}:${self.settings.proxyPort}`;
    if (self.settings.proxyMode === 'path')
        redirectUrl += `/${url.protocol.slice(0, -1)}/${url.host}`
    redirectUrl += `${url.pathname}${url.search}`

    return { redirectUrl };
},
    { urls: ["*://*.kancolle-server.com/*"] },
    ["blocking"]
);

chrome.webRequest.onBeforeRequest.addListener((details) => {
    if (!self.enable || self.settings.proxyMode === 'https-mitm') return;
    let url = new URL(details.url)
    console.log("HTTP:", url.href);
    if (self.serverHost && url.pathname?.includes('/kcs2/resources/world')) {
        const redirectUrl = details.url.replace(
            /\d{3}_\d{3}_\d{3}_\d{3}/,
            `${self.serverHost.split('.')[0].substring(1)}_ver_com`,
        )
        return { redirectUrl };
    }
},
    { urls: ["http://*/*"] },
    ["blocking"]
);

chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
    if (!self.enable || !self.settings.proxyMode === 'header') return;
    const url = new URL(details.url)
    if (['/gadget_html5/', '/kcscontents/'].some(x => url.pathname?.includes(x)))
        details.requestHeaders.push({ name: 'x-host', value: 'w00g.kancolle-server.com' });
    else if (self.serverHost)
        details.requestHeaders.push({ name: 'x-host', value: self.serverHost });
    return { requestHeaders: details.requestHeaders };
},
    { urls: ['http://*/*'] },
    ['blocking', 'requestHeaders'],
);

chrome.runtime.onMessage.addListener(async function (msg) {
    if (!msg)
        console.error("KCProxifier: Received null message.");
    else if (msg.action === 'apply-proxy')
        await self.applyProxy();
    else
        console.error("KCProxifier: Received unknown message", msg);
});

self.applyProxy();