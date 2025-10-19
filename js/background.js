(() => {

    console.log('KCProxifier: Loaded')

    let proxyHost = '127.0.0.1'
    let proxyPort = 8081
    let proxyEnable = true

    let serverHost

    function logSettings() {
        console.warn({ proxyHost, proxyPort, proxyEnable })
    }

    function loadSettings() {
        proxyHost = window.localStorage.getItem('proxyHost')
            || proxyHost
        proxyPort = window.localStorage.getItem('proxyPort')
            || proxyPort
        proxyEnable = window.localStorage.getItem('proxyEnable') === 'true'
            ?? proxyEnable
        logSettings()
    }

    function applySettings(host, port, enable) {
        proxyHost = host
        proxyPort = port
        proxyEnable = enable === true || enable === 'true'
        window.localStorage.getItem('proxyHost', proxyHost)
        window.localStorage.getItem('proxyPort', proxyPort)
        window.localStorage.getItem('proxyEnable', proxyEnable)
        logSettings()
    }

    chrome.runtime.onMessage.addListener((msg) => {
        if (!msg)
            console.log('KCProxifier: Received null message.')
        else if (msg.action === 'apply-proxy')
            applySettings(msg.host, msg.port, msg.enable)
        else
            console.log('KCProxifier: Received unknown message: ' + JSON.stringify(msg))
    })

    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            if (!proxyEnable || details.method !== 'GET') {
                return
            }

            if (details.url.includes('/kcscontents/news')) {
                return
            }

            console.log({ type: 'onBeforeRequest', method: details.method, url: details.url })

            const url = new URL(details.url)
            let redirectUrl = `${proxyHost}:${proxyPort}${url.pathname}${url.search}`
            if (!redirectUrl.includes('://')) {
                redirectUrl = 'http://' + redirectUrl
            }

            if (!url.host.includes('w00g')) {
                serverHost = url.host
            }

            return { redirectUrl }
        },
        { urls: ['*://*.kancolle-server.com/*'] },
        ['blocking'],
    )

    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            if (serverHost) {
                if (details.url.includes('resources/world')) {
                    const redirectUrl = details.url.replace(
                        /\d{3}_\d{3}_\d{3}_\d{3}/,
                        `${serverHost.split('.')[0].substring(1)}_ver_com`,
                    )
                    return { redirectUrl }
                }
            }
        },
        { urls: ['http://*/*'] },
        ['blocking'],
    )

    chrome.webRequest.onBeforeSendHeaders.addListener(
        (details) => {
            if (serverHost) {
                details.requestHeaders.push({ name: 'x-host', value: serverHost });
                return { requestHeaders: details.requestHeaders }
            }
        },
        { urls: ['http://*/*'] },
        ['blocking', 'requestHeaders'],
    )

    loadSettings()

})()
