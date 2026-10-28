import * as React from "react";
import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// jsdom não implementa requestAnimationFrame de um jeito que o
// framer-motion consegue usar pra sinalizar "animação terminou" — sem
// isso, AnimatePresence nunca desmonta o filho depois de sair (o
// elemento fica preso pra sempre com o estilo de "aberto"). Substitui
// motion.* por elementos comuns e AnimatePresence por um passthrough,
// já que os testes aqui validam comportamento (abre/fecha/onChange),
// não a animação em si.
vi.mock("framer-motion", () => {
  const stripMotionProps = (props: Record<string, unknown>) => {
    const { initial, animate, exit, transition, whileTap, whileHover, layout, ...rest } = props;
    return rest;
  };

  // Cache por tag: se o Proxy devolvesse um componente novo a cada
  // acesso, todo `motion.button` inline num render (sem const no
  // módulo) ganharia uma identidade de tipo diferente a cada
  // renderização — o React trata isso como um componente diferente e
  // desmonta/remonta o nó de verdade a cada render, perdendo o estado
  // (e o handler) bem no meio de um clique do userEvent.
  const cache = new Map<string, React.ComponentType<Record<string, unknown>>>();
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(
            tag,
            React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
              React.createElement(tag, { ...stripMotionProps(props), ref }),
            ),
          );
        }
        return cache.get(tag);
      },
    },
  );

  function AnimatePresence({ children }: { children?: React.ReactNode }) {
    return React.createElement(React.Fragment, null, children);
  }

  return { motion, AnimatePresence };
});
