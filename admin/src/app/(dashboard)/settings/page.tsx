import { BotConfigForm } from '@/components/BotConfigForm'
import { WAStatusPanel } from '@/components/WAStatusPanel'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <WAStatusPanel />
      <BotConfigForm />
    </div>
  )
}
