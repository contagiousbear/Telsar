const electron = require('electron')

const {
	app
} = electron
const {
	BrowserWindow
} = electron

let win

function createWindow() {
	win = new BrowserWindow({
		width: 650,
		height: 650,
		minWidth: 617,
		minHeight: 600,
		autoHideMenuBar: true,
		frame: false,
		center: true,
		"web-preferences": {
			"nodeIntegration": true
		}
	})

	win.loadURL(`file://${__dirname}/index.html`)

	win.on('closed', () => {
		win = null
	})

}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (win === null) {
		createWindow()
	}
})
