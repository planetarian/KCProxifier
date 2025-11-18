
const self = this;
const byId = (id) => document.getElementById(id);


self.loadSettings = function() {
    try {
        const data = {};
        data.proxyHost = window.localStorage.getItem('proxyHost');
        data.proxyPort = window.localStorage.getItem('proxyPort');
        data.proxyEnable = window.localStorage.getItem('proxyEnable');
        data.proxyMode = window.localStorage.getItem('proxyMode');
        if (!data.proxyHost) data.proxyHost = '127.0.0.1';
        if (!data.proxyPort) data.proxyPort = '8081';
        if (!data.proxyMode) data.proxyMode = 'path'
        return data;
    }
    catch (error) {
        console.error(`Error occurred while loading saved proxy settings.`, error);
        return { _error_: error };
    }
};

self.saveSettings = async function(host, port, enable, mode) {
    try {
        window.localStorage.setItem('proxyHost', host);
        window.localStorage.setItem('proxyPort', port);
        window.localStorage.setItem('proxyEnable', enable);
        window.localStorage.setItem('proxyMode', mode);
        self.applyProxy(host, port, enable, mode);
        byId('success').style.display = 'inline-block';
        setTimeout(() => byId('success').style.display = 'none', 3*1000);

        console.log("Proxy settings saved.");
    }
    catch (error) {
        console.error("Error occurred while saving proxy settings.", error);
    }
};

self.applyProxy = function(host, port, enable, mode) {
    const message = { action: 'apply-proxy', host, port, enable, mode };
    console.log("Sending message: " + JSON.stringify(message));
    chrome.runtime.sendMessage(message);
}

self.initialize = function(viewModel) {
    let settings = self.loadSettings();
    byId('success').style.display = 'none';
    byId('proxyhost').value = settings.proxyHost;
    byId('proxyport').value = settings.proxyPort;
    byId('proxyenable').checked = settings.proxyEnable == "true";
    document.forms.proxyform.proxymode.value = settings.proxyMode;

    byId('save').addEventListener('click', async () => {
        const host = byId('proxyhost').value;
        const port = byId('proxyport').value;
        const enable = byId('proxyenable').checked;
        const mode = document.forms.proxyform.proxymode.value;
        await self.saveSettings(host, port, enable, mode);
    });
}
document.addEventListener("DOMContentLoaded", () => self.initialize());