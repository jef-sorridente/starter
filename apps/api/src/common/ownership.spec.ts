import { InternalServerErrorException } from "@nestjs/common";
import { assertSingleOwner, ownerFor } from "./ownership";

describe("ownership", () => {
  it("ownerFor sem grupo devolve dono pessoal", () => {
    expect(ownerFor("u1", undefined)).toEqual({ userId: "u1", groupId: null });
  });

  it("ownerFor com grupo devolve dono de grupo e zera userId", () => {
    expect(ownerFor("u1", "g1")).toEqual({ userId: null, groupId: "g1" });
  });

  it("assertSingleOwner barra registro sem dono", () => {
    expect(() => assertSingleOwner({ userId: null, groupId: null })).toThrow(InternalServerErrorException);
  });

  it("assertSingleOwner barra registro com dois donos", () => {
    expect(() => assertSingleOwner({ userId: "u1", groupId: "g1" })).toThrow(InternalServerErrorException);
  });
});
