"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "manifest.json"), "utf8"));
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
const indexHtml = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
const pluginScript = fs.readFileSync(path.join(projectRoot, "js/plugin.js"), "utf8");

assert.equal(manifest.name, "eagle-quick-rename", "Eagle 显示名称应保持一致");
assert.equal(manifest.version, packageJson.version, "manifest 与 package 版本应一致");
assert.ok(fs.existsSync(path.join(projectRoot, manifest.main.url)), "manifest 入口文件必须存在");
assert.ok(fs.existsSync(path.join(projectRoot, manifest.logo.slice(1))), "插件图标必须存在");
assert.match(indexHtml, /id="rename-button"/, "界面应包含普通重命名按钮");
assert.match(indexHtml, /id="rename-close-button"/, "界面应包含重命名并关闭按钮");
assert.match(pluginScript, /eagle\.window\?\.hide/, "关闭按钮应使用 Eagle Window API 隐藏窗口");

console.log("project structure: all tests passed");
