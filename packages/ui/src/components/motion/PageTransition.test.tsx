import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { PageTransition } from "./PageTransition";

function Field() {
  const [value, setValue] = React.useState("");
  return <input aria-label="campo" value={value} onChange={(e) => setValue(e.target.value)} />;
}

describe("PageTransition", () => {
  it("re-renderizar com a mesma rota não remonta a página (o que foi digitado continua)", async () => {
    const { rerender } = render(
      <PageTransition routeKey="/a">
        <Field />
      </PageTransition>,
    );
    await userEvent.setup().type(screen.getByLabelText("campo"), "oi");

    rerender(
      <PageTransition routeKey="/a">
        <Field />
      </PageTransition>,
    );

    expect(screen.getByLabelText("campo")).toHaveValue("oi");
  });

  it("trocar de rota monta a página nova uma única vez", () => {
    let mounts = 0;
    function Page() {
      React.useEffect(() => {
        mounts += 1;
      }, []);
      return <p>página</p>;
    }
    const { rerender } = render(
      <PageTransition routeKey="/a">
        <Page />
      </PageTransition>,
    );
    rerender(
      <PageTransition routeKey="/b">
        <Page />
      </PageTransition>,
    );

    // 1 montagem em /a + 1 em /b — nunca a página nova montada duas vezes.
    expect(mounts).toBe(2);
  });
});
