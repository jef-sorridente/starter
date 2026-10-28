import base from "@app/config/stylelint";

export default {
  ...base,
  ignoreFiles: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/storybook-static/**", "**/coverage/**"],
  overrides: [
    {
      // Os tokens são justamente onde as cores cruas moram.
      files: ["packages/ui/src/tokens/**/*.css"],
      rules: {
        "color-no-hex": null,
        "color-named": null,
        "function-disallowed-list": null,
      },
    },
  ],
};
