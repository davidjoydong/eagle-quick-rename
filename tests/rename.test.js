"use strict";

const assert = require("node:assert/strict");
const QuickRename = require("../js/rename.js");

function names(plan) {
  return plan.map((entry) => entry.newName);
}

assert.deepEqual(
  names(
    QuickRename.buildRenamePlan(
      [{ name: "海报" }, { name: "封面" }, { name: "插画" }],
      { start: 1, digits: 3, separator: "", baseName: "" },
    ),
  ),
  ["海报001", "封面002", "插画003"],
  "留空统一名称时应保留各条目的原始名称",
);

assert.deepEqual(
  names(
    QuickRename.buildRenamePlan(
      [{ name: "海报" }, { name: "封面" }, { name: "插画" }],
      { start: 1, digits: 3, separator: "-", baseName: "产品图" },
    ),
  ),
  ["产品图 001", "产品图 002", "产品图 003"],
  "输入统一名称后应忽略原始名称并固定使用空格",
);

assert.equal(
  QuickRename.buildNewName("图片", 2, { start: 8, digits: 4, separator: "_" }),
  "图片_0010",
  "应正确应用起始编号、位数与分隔符",
);

assert.deepEqual(
  QuickRename.normalizeOptions({ start: -5, digits: 99, baseName: "  名称  " }),
  { start: 0, digits: 8, separator: "", baseName: "名称" },
  "参数应被限制在支持范围内并清理统一名称",
);

assert.throws(
  () => QuickRename.buildRenamePlan(null),
  { name: "TypeError", message: "items 必须是数组" },
  "非数组输入应抛出明确错误",
);

console.log("rename logic: all tests passed");
