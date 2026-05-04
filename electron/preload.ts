import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  resizeWindow: (height: number) => ipcRenderer.send("resize-window", height),
  authGoogle: () => ipcRenderer.invoke("google-auth"),
  getCalendarEvents: () => ipcRenderer.invoke("get-calendar-events"),
  createCalendarEvent: (title: string, deadline: string) =>
    ipcRenderer.invoke("create-calendar-event", title, deadline),
  deleteCalendarEvent: (eventId: string) =>
    ipcRenderer.invoke("delete-calendar-event", eventId),
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  getWeather: () => ipcRenderer.invoke("get-weather"),
});
