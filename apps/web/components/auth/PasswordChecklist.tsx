"use client";

import { Icon } from "@app/ui";
import { passwordChecklist } from "@app/shared";
import styles from "./PasswordChecklist.module.css";

interface PasswordChecklistProps {
  password: string;
  /** Nome/e-mail do usuário — quando presentes, adiciona o item "diferente do seu nome/e-mail". */
  identifiers?: Array<string | undefined | null>;
}

export function PasswordChecklist({ password, identifiers = [] }: PasswordChecklistProps) {
  const checks = passwordChecklist(password, identifiers);

  return (
    <ul className={styles.list}>
      {checks.map((check) => (
        <li key={check.key} className={check.valid ? styles.itemValid : styles.item}>
          <Icon name={check.valid ? "check" : "circle"} size={12} color="currentColor" />
          {check.label}
        </li>
      ))}
    </ul>
  );
}
