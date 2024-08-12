
const self = this;

self.loadSettings = function() {
    try {
        const data = {};
        data.proxyHost = window.localStorage.getItem('proxyHost');
        data.proxyPort = window.localStorage.getItem('proxyPort');
        data.proxyEnable = window.localStorage.getItem('proxyEnable');
        return data;
    }
    catch (error) {
        console.log(`Error occurred while loading saved proxy settings.\n${error}`);
        return { _error_: error };
    }
};

self.generatePac = function(host, port) {
    const ips = [
        '203.104.209.71',
        '203.104.209.87',
        '125.6.184.215',
        '203.104.209.183',
        '203.104.209.150',
        '203.104.209.134',
        '203.104.209.167',
        '203.104.209.199',
        '125.6.189.7',
        '125.6.189.39',
        '125.6.189.71',
        '125.6.189.103',
        '125.6.189.135',
        '125.6.189.167',
        '125.6.189.215',
        '125.6.189.247',
        '203.104.209.23',
        '203.104.209.39',
        '203.104.209.55',
        '203.104.209.102'
    ];
    const gadget = '203.104.209.7';

    const ipsExp = ips.join('|');
    const pac = 'function FindProxyForURL(url, host) {\n'
    + `  if (shExpMatch(url, "http://(${ipsExp})/(kcs|kcs2)/*") || host == "${gadget}")\n`
    + `    return "PROXY ${host}:${port}";\n`
    + '  return "DIRECT";\n'
    + '}\n';

    return pac;
};

self.applyProxy = function (host, port, enable) {
    // todo: look into relinquishing our proxy control completely if disabled
    const config = {mode: enable ? 'pac_script' : 'direct'};
    if (enable)
        config.pacScript = { data: self.generatePac(host, port), mandatory: true };
    chrome.browserAction.setIcon({path: '/assets/icons/KCProxifier_' + (enable ? 'green' : 'blue') + '_32.png'});
    chrome.proxy.settings.set(
        { value: config, scope: 'regular' },
        () => console.log(`proxy configured with data: ${JSON.stringify(config)}`)
    );
};

chrome.runtime.onMessage.addListener(function(msg) {
    if (!msg)
        console.log("KCProxifier: Received null message.");
    else if (msg.action === 'apply-proxy')
        applyProxy(msg.host, msg.port, msg.enable);
    else
        console.log("KCProxifier: Received unknown message: " + JSON.stringify(msg));
});

const settings = self.loadSettings();
self.applyProxy(settings?.proxyHost, settings.proxyPort, settings.proxyEnable === "true");