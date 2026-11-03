---
title: インストールの完了を、ライセンス付きで知らせる
description: Lua のパッケージマネージャ LuaRocks の util.announce_install。インストールしたパッケージの名前、版、場所を表示します。ライセンスが書かれていれば、それも添えます。
language: lua
project: LuaRocks
repo: https://github.com/luarocks/luarocks
license: MIT
copyright: Copyright 2007-2011, Kepler Project. Copyright 2011-2022, the LuaRocks project authors.
commit: "85bfe36c812465b2f377877939d884a4db829a25"
file: src/luarocks/util.lua
lines: [264, 274]
format: 2
function: util.announce_install
difficulty: 2
tags: [入出力, 文字列処理, 可読性]
---
## ひとことで

`util.announce_install(rockspec)` は、パッケージのインストールが終わったことを、利用者に伝える関数です。パッケージの名前と版、インストール先の場所を一行にまとめて表示します。rockspec にライセンスが書かれていれば、その情報も括弧の中に添えます。

## コード

```lua:line-numbers=264
function util.announce_install(rockspec)
   local path = require("luarocks.path")

   local suffix = ""
   if rockspec.description and rockspec.description.license then
      suffix = " (license: " .. rockspec.description.license .. ")"
   end

   util.printout(rockspec.name .. " " .. rockspec.version .. " is now installed in " .. path.root_dir(cfg.root_dir) .. suffix)
   util.printout()
end
```

## 前提知識

- **rockspec**: LuaRocks がパッケージの情報を書く設定の表です。名前、版、説明などが入っています。
- **`path.root_dir`**: インストール先のルートの場所を返す LuaRocks の関数です。`cfg.root_dir` は、その設定です。
- **`util.printout`**: 表示を担当する LuaRocks の関数です。引数をタブで区切って、一行で書きます。
- **`and` ではなく `if` で追加する**: ライセンスがないときは、文字列を追加しない `if` を使います。説明の省略を、分かりやすく書いています。

## 何をしているか

### 1. 任意のライセンス表記を用意する

rockspec の説明に、ライセンスがあれば、その名前を括弧つきの文字列にして `suffix` に入れます。なければ、空の文字列のままです。

```lua:line-numbers=267
   local suffix = ""
   if rockspec.description and rockspec.description.license then
      suffix = " (license: " .. rockspec.description.license .. ")"
   end
```

### 2. 名前と版と場所をつないで表示する

パッケージの名前、版、インストール先の場所を連結し、最後に `suffix` を付けて表示します。

```lua:line-numbers=272
   util.printout(rockspec.name .. " " .. rockspec.version .. " is now installed in " .. path.root_dir(cfg.root_dir) .. suffix)
```

### 3. 空行を一つ入れる

表示のあとに、空行を一つ入れます。後に続く出力と、区切りがつきます。

```lua:line-numbers=273
   util.printout()
```

## ここがすごい

- **分かりやすい完了の一言**: インストールした名前、版、場所が、一行でわかります。何が入ったかを、すぐ確認できます。
- **省略できる情報を後ろに**: ライセンスは、あれば添え、なければ省きます。情報が欠けていても、表示が壊れません。
- **表示の処理を一か所に**: 出力は `util.printout` に任せています。タブや改行の形を、ほかの表示と揃えられます。
- **注意点**: 連結で値を使うので、名前や版が `nil` だと、ここでエラーになります。rockspec の必須項目は、事前に確かめられている必要があります。

## まとめ

- 完了の通知は、欠けやすい情報を後ろに付けると、一行の形を保てる。
- 表示の出し方を専用の関数に任せると、全体の出力の形が揃う。
- 連結に使う値が必ずあるように、入力の確認は前の段階で済ませておく。
