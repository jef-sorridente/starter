// Um arquivo por domínio, cada um com os schemas zod (validação de
// verdade na API, validação de formulário no web/mobile) e os tipos de
// resposta. Regra de negócio nunca é reimplementada fora daqui.
export * from "./app";
export * from "./common";
export * from "./password-policy";
export * from "./auth";
export * from "./profiles";
export * from "./groups";
export * from "./notifications";
export * from "./notes";
