import { CaptureForm } from '@/components/os/CaptureForm';

export default function CapturePage() {
  return (
    <div className="os-page">
      <header className="os-page-header">
        <p className="os-eyebrow">Capture</p>
        <h1>Get it out of your head.</h1>
        <p>Raw input is written into Obsidian Inbox. Classification and routing can happen after capture instead of before it.</p>
      </header>
      <CaptureForm />
    </div>
  );
}
