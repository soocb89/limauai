import { BotConfigForm } from '@/components/BotConfigForm'

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <BotConfigForm />
    </div>
  )
}
