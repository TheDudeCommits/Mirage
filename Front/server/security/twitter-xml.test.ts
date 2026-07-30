import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const TwitterStrategy = require("passport-twitter").Strategy as {
  prototype: {
    parseErrorResponse(body: string, status: number): Error;
  };
};

test("parses Twitter OAuth XML errors through the maintained DOM implementation", () => {
  const error = TwitterStrategy.prototype.parseErrorResponse(
    "<errors><error>Authorization denied</error></errors>",
    401,
  );

  assert.equal(error.message, "Authorization denied");
});
