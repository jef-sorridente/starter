"use client";

import * as React from "react";
import { IconButton, Input, InputProps } from "@app/ui";

// Wrapper fino sobre o Input do design system — só adiciona o botão de
// revelar/ocultar senha (ícone de olho), reaproveitado em todo campo de
// senha do app (login, registro, redefinição, troca de senha, exclusão
// de conta) em vez de repetir o toggle de estado em cada tela.
export type PasswordFieldProps = Omit<InputProps, "type" | "suffix">;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      suffix={
        <IconButton
          icon={visible ? "eye-off" : "eye"}
          label={visible ? "Ocultar senha" : "Mostrar senha"}
          variant="ghost"
          size={28}
          onClick={() => setVisible((v) => !v)}
        />
      }
    />
  );
}
