
const self = this;
const byId = (id) => document.getElementById(id);


self.loadSettings = function() {
    try {
        const data = {};
        data.proxyHost = window.localStorage.getItem('proxyHost');
        data.proxyPort = window.localStorage.getItem('proxyPort');
        data.proxyEnable = window.localStorage.getItem('proxyEnable');
        if (!data.proxyHost) data.proxyHost = '127.0.0.1';
        if (!data.proxyPort) data.proxyPort = '8081';
        return data;
    }
    catch (error) {
        console.log(`Error occurred while loading saved proxy settings.\n${error}`);
        return { _error_: error };
    }
};

self.saveSettings = async function(host, port, enable) {
    try {
        window.localStorage.setItem('proxyHost', host);
        window.localStorage.setItem('proxyPort', port);
        window.localStorage.setItem('proxyEnable', enable);
        self.applyProxy(host, port, enable);
        byId('success').style.display = 'inline-block';
        setTimeout(() => byId('success').style.display = 'none', 3*1000);
    }
    catch (err) {
        console.err(`Error occurred while saving proxy settings.\n${err}`);
    }
};

self.applyProxy = function(host, port, enable) {
    const message = { action: 'apply-proxy', host, port, enable };
    console.log("Sending message: " + JSON.stringify(message));
    chrome.runtime.sendMessage(message);
}

self.initialize = function(viewModel) {
    let settings = self.loadSettings();
    byId('success').style.display = 'none';
    byId('proxyhost').value = settings.proxyHost;
    byId('proxyport').value = settings.proxyPort;
    byId('proxyenable').checked = settings.proxyEnable == "true";
    byId('save').addEventListener('click', async () => {
        const host = byId('proxyhost').value;
        const port = byId('proxyport').value;
        const enable = byId('proxyenable').checked;
        await self.saveSettings(host, port, enable);
    });
}
document.addEventListener("DOMContentLoaded", () => self.initialize());