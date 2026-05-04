import { app, Menu, MenuItemConstructorOptions, Tray, nativeImage, BrowserWindow } from "electron";

const TRAY_ICON_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAHElEQVR4nGNgGAWjYBSMglEwCkbBKBgFo2AUjAIAAQ4AAR5nYe0AAAAASUVORK5CYII=";

const showWindow = (window: BrowserWindow): void => {
  if (!window.isVisible()) {
    window.show();
  }
  window.focus();
};

export const createTray = (window: BrowserWindow): Tray => {
  const icon = nativeImage.createFromDataURL(TRAY_ICON_DATA_URL);
  const tray = new Tray(icon);

  const toggleWindowVisibility = () => {
    if (window.isVisible()) {
      window.hide();
    } else {
      showWindow(window);
    }
  };

  const contextMenuTemplate: MenuItemConstructorOptions[] = [
    { label: "DailyManager", enabled: false },
    { type: "separator" },
    {
      label: "Pokaż",
      click: () => {
        showWindow(window);
      }
    },
    {
      label: "Ukryj",
      click: () => {
        window.hide();
      }
    },
    {
      label: "Zamknij aplikację",
      click: () => {
        app.quit();
      }
    }
  ];

  tray.setToolTip("DailyManager");
  tray.setContextMenu(Menu.buildFromTemplate(contextMenuTemplate));
  tray.on("double-click", () => {
    showWindow(window);
  });

  return tray;
};
