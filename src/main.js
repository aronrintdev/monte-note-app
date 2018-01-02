"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const notebookManager_1 = require("./utils/notebook-management/notebookManager");
const index_1 = require("./constants/index");
// import Db from './db/index';
const dbMessager_1 = require("./utils/dbMessager");
// let db = new Db().getDb() as Nedb;
let mainWindow;
let notebookManager;
let dbMessager = new dbMessager_1.default();
function createWindow() {
    // Create the browser window.
    mainWindow = new electron_1.BrowserWindow({
        height: 600,
        width: 800,
    });
    // // and load the index.html of the app.
    // mainWindow.loadURL(url.format({
    //     pathname: path.join(__dirname, '../index.html'),
    //     protocol: 'file:',
    //     slashes: true,
    // }));
    mainWindow.loadURL('http://localhost:3000');
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        // mainWindow = null;
    });
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on('ready', createWindow);
// Quit when all windows are closed.
electron_1.app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
electron_1.ipcMain.on('get-global-packages', () => {
    console.log('create nbook!');
});
electron_1.ipcMain.on('is-location-for-notebooks-set', (event, args) => {
    event.sender.send('start-it!', notebookManager_1.default.getNotebookLocation());
});
electron_1.ipcMain.on(index_1.CHOOSE_LOCATION_FOR_NOTEBOOKS, (event, args) => {
    let location = electron_1.dialog.showOpenDialog({ properties: ['openDirectory'] }).shift();
    // notebookManager = new NotebookManager(notebooksDirectory as string);
    notebookManager.setNotebooksLocation(location)
        .then((result) => {
        if (result) {
            event.sender.send('location-for-notebooks', location);
        }
    });
});
electron_1.ipcMain.on(index_1.ADD_NOTEBOOK, (event, args) => {
    try {
        notebookManager.addNotebook(args);
    }
    catch (error) {
        // Retrieve notebook directory location from electron-store storage
        // notebookManager = new NotebookManager(NotebookManager.getNotebookLocation());
        notebookManager.addNotebook(args);
    }
    finally {
        event.sender.send(index_1.ADD_NOTEBOOK, args);
    }
});
electron_1.ipcMain.on(index_1.GET_NOTEBOOKS, (event, args) => {
    console.log('GET THE NOTEBOOKS FROM DB.');
    // Bootstrap db with notebooks entry
    dbMessager.getNotebooks()
        .then((notebooks) => {
        console.log(notebooks);
        event.sender.send(index_1.GET_NOTEBOOKS, notebooks);
    });
});
electron_1.ipcMain.on(index_1.LOAD_SETTINGS, (event) => {
    console.log('Query DB to get the application settings.');
    dbMessager.loadSettings()
        .then((settings) => {
        event.sender.send(index_1.LOAD_SETTINGS, settings);
    });
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here. 
