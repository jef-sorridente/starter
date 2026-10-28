import { ShellMetaProvider } from "@/components/shell/ShellContext";
import { AppShellFrame } from "@/components/shell/AppShellFrame";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShellMetaProvider>
      <AppShellFrame>{children}</AppShellFrame>
    </ShellMetaProvider>
  );
}
