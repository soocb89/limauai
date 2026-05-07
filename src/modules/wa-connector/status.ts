export type WAStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected'

let _status: WAStatus = 'disconnected'
let _qr: string | null = null

export function setWAStatus(s: WAStatus) { _status = s }
export function setWAQR(qr: string | null) { _qr = qr }
export function getWAStatus() { return _status }
export function getWAQR() { return _qr }
