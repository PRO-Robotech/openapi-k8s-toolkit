/* eslint-disable import/no-default-export */
/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'novnc-next' {
  export default class RFB {
    constructor(target: HTMLElement, urlOrChannel: string | WebSocket, options?: any)
    addEventListener(type: string, handler: (e: any) => void): void
    disconnect(): void
    sendCtrlAltDel(): void
    scaleViewport: boolean
    resizeSession: boolean
    showDotCursor: boolean
  }
}
