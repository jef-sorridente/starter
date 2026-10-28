// Fonte única da navegação do app: o menu lateral, a busca do header e
// o destaque do item ativo leem daqui. Módulo novo = uma linha nova.
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Menu",
    items: [
      { id: "inicio", label: "Início", icon: "layout-dashboard", href: "/inicio" },
      { id: "anotacoes", label: "Anotações", icon: "file-text", href: "/anotacoes" },
      { id: "grupos", label: "Grupos", icon: "users", href: "/grupos" },
    ],
  },
  {
    title: "Ajustes",
    items: [
      { id: "notificacoes", label: "Notificações", icon: "bell", href: "/notificacoes" },
      { id: "perfil", label: "Perfil", icon: "circle-user", href: "/perfil" },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export function activeNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
