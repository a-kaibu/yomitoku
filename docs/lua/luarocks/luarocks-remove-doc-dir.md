---
title: インストール先から doc フォルダを削除する remove_doc_dir
description: Lua のパッケージマネージャ LuaRocks の util.remove_doc_dir。パッケージを削除するときに、インストール先の中にある doc や docs のフォルダを消します。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [578, 592]
format: 2
function: util.remove_doc_dir
difficulty: 2
tags: [入出力, 防御的プログラミング, イテレータ]
---
## ひとことで

`util.remove_doc_dir(name, version)` は、指定したパッケージのインストール先を調べ、そこにある `doc` と `docs` という名前のフォルダを削除する関数です。パッケージの削除の後始末として、ドキュメントだけを消すために使われます。

## コード

```lua:line-numbers=578
function util.remove_doc_dir(name, version)
   local path = require("luarocks.path")
   local fs = require("luarocks.fs")
   local dir = require("luarocks.dir")

   local install_dir = path.install_dir(name, version)
   for _, f in ipairs(fs.list_dir(install_dir)) do
      local doc_dirs = { "doc", "docs" }
      for _, d in ipairs(doc_dirs) do
         if f == d then
            fs.delete(dir.path(install_dir, f))
         end
      end
   end
end
```

## 前提知識

- **`require` による部品の読み込み**: `require("luarocks.path")` のように書くと、LuaRocks の他のモジュールを使えます。ここでは、場所、ファイル操作、パスの組み立てを、それぞれ読み込んでいます。
- **`path.install_dir`**: パッケージの名前と版から、インストール先のフォルダを求める関数です。
- **`fs.list_dir`**: フォルダの中身の一覧を返す関数です。ファイルとフォルダの名前が、並んで返されます。
- **`dir.path`**: フォルダとファイル名をつないで、パスを作る関数です。OS に応じた区切り文字を使います。

## 何をしているか

### 1. 必要な部品を読み込み、インストール先を求める

`path`、`fs`、`dir` の三つのモジュールを読み込みます。そして、パッケージのインストール先を `path.install_dir` で決めます。

```lua:line-numbers=579
   local path = require("luarocks.path")
   local fs = require("luarocks.fs")
   local dir = require("luarocks.dir")

   local install_dir = path.install_dir(name, version)
```

### 2. 中身を一つずつ確かめる

`fs.list_dir` でインストール先の一覧を取り、それぞれの名前を調べます。消す対象は、`doc` と `docs` の二つだけです。

```lua:line-numbers=584
   for _, f in ipairs(fs.list_dir(install_dir)) do
      local doc_dirs = { "doc", "docs" }
      for _, d in ipairs(doc_dirs) do
         if f == d then
            fs.delete(dir.path(install_dir, f))
         end
      end
```

### 3. 一致したものだけを削除する

名前が `doc` や `docs` と一致したら、`dir.path` でフォルダの場所をつなぎ、`fs.delete` で削除します。それ以外のファイルやフォルダには、何もしません。

## ここがすごい

- **消す対象を明示**: 削除する名前を、表にはっきり書いています。意図しないファイルを消す危険を減らしています。
- **安全な組み立て**: パスは `dir.path` でつなぐので、区切り文字の違いを気にせずに済みます。
- **必要な部分だけ**: インストール先の中身を見て、対象だけを削除します。他の内容には触れません。
- **注意点**: 名前が一致すれば、ファイルでもフォルダでも削除されます。想定と違う中身があると、大事なものを消すおそれがあるので、対象の名前は慎重に決める必要があります。

## まとめ

- 削除を伴う処理は、消す対象を一覧で明示すると、思わぬものを消す事故を防げる。
- パスは専用の関数で組み立てると、環境の違いに強くなる。
- 後始末の処理は、必要な範囲だけに限ると、他の内容を壊さずに済む。
