const electron = require("electron");
const url = require("url");
const path = require("path");
const fs = require("fs");
const db = require("./db.js");

const { app, BrowserWindow, Menu, ipcMain } = electron;

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 1500
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file"
    })
  );

  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);
});

const mainMenuTemplate = [
  {
    label: "File",
    submenu: [
      {
        label: "Quit",
        accelerator: process.platform == "darwin" ? "Command+Q" : "Ctrl+Q",
        click() {
          app.quit();
        }
      }
    ]
  }
];

if (process.platform == "darwin") {
  mainMenuTemplate.push({});
}
if (process.env.NODE_ENV !== "production") {
  mainMenuTemplate.push({
    label: "Developer Tools",
    submenu: [
      {
        accelerator: process.platform == "darwin" ? "Command+I" : "Ctrl+I",
        label: "Toggle DevTools",
        click(item) {
          mainWindow.toggleDevTools();
        }
      },
      {
        accelerator: process.platform == "darwin" ? "Command+R" : "Ctrl+R",
        label: "Reload",
        role: "reload"
      }
    ]
  });
}
ipcMain.on("data:fetch", (event, arg) => {
  db.read().then(data => event.sender.send("data:fetched", data));
});
ipcMain.on("load:new", (e, arg) => {
  let file = arg.BOL;
  let id = arg.id;
  fs.createReadStream(file).pipe(
    fs.createWriteStream(
      path.join(__dirname, `data/${id}.${file.split(".").pop()}`)
    )
  );
  arg.BOL = path.join(__dirname, "data", `${id}.${file.split(".").pop()}`);
  db.read().then(item => {
    item.load.push(arg);
    db.write(item);
    e.sender.send("load:back");
  });
});

ipcMain.on("load:edit", (e, arg) => {
  db.read().then(data=>{
    let index = -1;
    let load=[];
    data.load.forEach((item,i)=>{
      if(item.id === arg.load.id){
        load.push(arg.load);
      }else{
        load.push(item);
      }
    });
    data.load = load;
    db.write(data);
    e.sender.send("load:back");
  })
});
ipcMain.on("load:delete", (e, arg) => {
  db.read().then(data=>{
    let load = data.load.filter(item=>item.id!==arg.id);
    data.load = load;
    db.write(data);
    e.sender.send("load:back");
  })
});

ipcMain.on("customers:length", (e, arg) => {
  db.read().then(item => {
    e.sender.send("customers:length", item.customers.length);
  });
});
ipcMain.on("customers:list", (e, arg) => {
  db.read().then(item => {
    e.sender.send("customers:list", item.customers);
  });
});
ipcMain.on("customers:delete", (e, arg) => {
  db.read().then(items => {
    var newItems = items;
    newItems.customers = items.customers.filter(x => x.id !== arg);
    db.write(newItems);
    e.sender.send("customers:back");
  });
});

ipcMain.on("customers:new", (e, arg) => {
  db.read().then(item => {
    item.customers.push(arg);
    db.write(item);
    e.sender.send("customers:back");
  });
});

ipcMain.on("customers:edit", (e, arg) => {
  db.read().then(item => {
    for (var i = 0; i < item.customers.length; i++) {
      if (item.customers[i].id === arg.id) {
        item.customers[i] = arg;
        break;
      }
    }
    db.write(item);
    e.sender.send("customers:back");
  });
});

ipcMain.on("drivers:fetch", (e, arg) => {
  db.read()
    .then(data => {
      e.sender.send("drivers:fetch", data.drivers);
    })
    .catch(x => console.log(x));
});

ipcMain.on("drivers:edit", (e, arg) => {
  db.read().then(data => {
    for (var i = 0; i < data.drivers.length; i++) {
      if (data.drivers[i].id == arg.id) {
        data.drivers[i] = arg;
        e.sender.send("drivers:back");
        break;
      }
    }
  });
});
ipcMain.on("drivers:new", (e, arg) => {
  db.read().then(data => {
    console.log(data.drivers.push(arg));
    db.write(data);
    e.sender.send("drivers:back");
  });
});
