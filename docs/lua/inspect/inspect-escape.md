---
title: 制御文字を読める記号に変える、3 段の gsub
description: Lua のデバッグ表示ライブラリ inspect.lua の escape。バックスラッシュ、制御文字、数字の直前の制御文字を、順番を決めた 3 回の gsub で表示用の形に変換します。
language: lua
project: inspect.lua
repo: https://github.com/kikito/inspect.lua
license: MIT
copyright: Copyright (c) 2013 Enrique García Cota
commit: "a8ca3120dfec48801036eaeff9335ab7a096dd24"
file: inspect.lua
lines: [118, 122]
format: 2
function: escape
difficulty: 3
tags: [文字列処理, 正規表現, 可読性]
---

## ひとことで

`escape(str)` は、文字列の中の制御文字（改行やタブなどの見えない文字）を、`\n` や `\009` のような表示用の形に変える関数です。`inspect` で文字列を表示するときに、画面に出しても読める形にするためのものです。3 回の `gsub` を入れ子にして、順番に変換します。

## コード

```lua:line-numbers=118
local function escape(str)
   return (gsub(gsub(gsub(str, "\\", "\\\\"),
   "(%c)%f[0-9]", longControlCharEscapes),
   "%c", shortControlCharEscapes))
end
```

変換に使う 2 つの表は、関数の前で作られています。読むのに必要なので引用します。

```lua:line-numbers=105
local shortControlCharEscapes = {
   ["\a"] = "\\a", ["\b"] = "\\b", ["\f"] = "\\f", ["\n"] = "\\n",
   ["\r"] = "\\r", ["\t"] = "\\t", ["\v"] = "\\v", ["\127"] = "\\127",
}
local longControlCharEscapes = { ["\127"] = "\127" }
for i = 0, 31 do
   local ch = char(i)
   if not shortControlCharEscapes[ch] then
      shortControlCharEscapes[ch] = "\\" .. i
      longControlCharEscapes[ch] = fmt("\\%03d", i)
   end
end
```

## 前提知識

- **`gsub`**: `gsub(文字列, パターン, 置き換え)` は、パターンに一致する部分を置き換えた新しい文字列を返します。置き換えには文字列か表（テーブル）を渡せます。
- **`%c`**: 制御文字を表すパターンです。`\n` や `\t` などが含まれます。
- **`%f[0-9]`（フロンティア）**: 「ここから先が数字になる」という位置だけを表す、マッチしない目印です。ここでは、制御文字の直後が数字かどうかを見るために使います。
- **エスケープの二重化**: `"\\"` は、Lua の文字列では 1 つの `\` です。表示用の `\\` を作るには `"\\\\"` と書きます。

## 何をしているか

### 1. まず `\` 自身を二重にする

最初の `gsub` で、`\` を `\\` に変えます。後で `\n` などの記号を足すので、もとの `\` と区別できるように先に二重にします。この順番を逆にすると、足した `\` まで二重になってしまいます。

```lua:line-numbers=119
   return (gsub(gsub(gsub(str, "\\", "\\\\"),
```

### 2. 数字の直前の制御文字は 3 桁にする

次の `gsub` は、制御文字の直後に数字が続く場合に、`longControlCharEscapes` の 3 桁の形（`\001` など）を使います。`\1` のように短く書くと、直後の数字と合わさって別の文字として読まれてしまうからです。`%f[0-9]` は、その数字の位置だけを見る目印です。

```lua:line-numbers=120
   "(%c)%f[0-9]", longControlCharEscapes),
```

### 3. 残りの制御文字は短い記号にする

最後の `gsub` は、残った制御文字をすべて `shortControlCharEscapes` の表の値に変えます。`\n` は `\\n`、つまり `\n` という 2 文字になります。表にない制御文字は、`\` と番号の形になります。

```lua:line-numbers=121
   "%c", shortControlCharEscapes))
```

## ここがすごい

- **順番で正しさを守る**: `\` を最初に二重にすることで、後から足す `\` が巻き込まれません。3 回の変換は、どれを先にやるかが決まっています。
- **直後の数字に気を配る**: `\1` と `2` が並ぶと `\12` と読まれてしまいます。`%f[0-9]` で数字の直前だけを 3 桁にする工夫で、表示の曖昧さを消しています。
- **表で変換を外に出す**: 変換の対応は表に置かれているので、`gsub` の本体は 3 行で済みます。表を読めば何が変わるかがわかります。
- **トレードオフ**: 3 回の `gsub` は、文字列を 3 回走査します。ただし表示用の処理で、文字列は通常短いので、読みやすさを優先した設計です。

## まとめ

- 文字列の変換は、順番を決めた複数の `gsub` にすると、一つずつ読んで理解できる。
- 先に `\` を変換すると、後から足す記号を巻き込まずに済む。
- フロンティアパターン `%f` を使うと、前後の文字に応じた条件を書ける。
