---
title: コメントを付けるかを決める、comment の一行
description: Lua のシリアライズライブラリ serpent の comment。値の文字列を、長さの上限つきでコメントとして埋め込みます。上限を超えると、何も付けません。
language: lua
project: serpent
repo: https://github.com/pkulchenko/serpent
license: MIT
copyright: Copyright (c) 2012-2018 Paul Kulchenko
commit: "139fc18263bc5ffecc1729147891f1eb383046bf"
file: src/serpent.lua
lines: [36, 36]
format: 2
function: comment
difficulty: 2
tags: [文字列処理, 可読性, 防御的プログラミング]
---
## ひとことで

`comment(s, l)` は、値 `s` を Lua のコメントの形 `--[[ ... ]]` にして返す関数です。ただし、コメントを付ける設定がオフのときや、深さ `l` が上限を超えたときは、何も返しません。出力に、補足の情報を控えめに添えるための関数です。

## コード

```lua:line-numbers=36
  local function comment(s,l) return comm and (l or 0) < comm and ' --[['..select(2, pcall(tostring, s))..']]' or '' end
```

## 前提知識

- **Lua のブロックコメント**: `--[[` から `]]` までを、コメントとして無視する書き方です。複数行にわたっても使えます。
- **`pcall(tostring, s)`**: `tostring` を保護された呼び出しで実行します。`__tostring` がエラーを起こしても、関数全体は止まりません。
- **`select(2, ...)`**: `pcall` の結果から、二つ目の値を取り出します。`pcall` の最初の値は成否なので、中身だけが残ります。
- **`and` と `or` の組み合わせ**: 条件が真なら、中間の値を、偽なら `''` を返す書き方です。

## 何をしているか

### 1. 設定と深さで、付けるかを決める

`comm` が設定されていて、かつ深さ `l` が `comm` より小さいときだけ、コメントを作ります。`l` が省略されたときは、`0` として扱います。

```lua:line-numbers=36
  local function comment(s,l) return comm and (l or 0) < comm and ' --[['..select(2, pcall(tostring, s))..']]' or '' end
```

### 2. 値を安全に文字列にして、コメントで囲む

`pcall(tostring, s)` で値を文字列にし、その前後を `--[[` と `]]` で囲みます。`tostring` が失敗しても、エラーにならずに文字列を得られます。

## ここがすごい

- **条件が一行に詰まっている**: 設定の有無、深さの上限、作る文字列の三つが、`and` と `or` で一つの式になっています。
- **失敗に強い**: `pcall` で包むので、値の表示が失敗しても、出力全体が壊れません。
- **深さで出力を抑える**: 深く入れ子になった値には、コメントを付けません。大きな出力を、読みやすく保てます。
- **注意点**: 値の中に `]]` という文字列があると、コメントが途中で閉じてしまいます。コメントに入れる値の形には、注意が必要です。

## まとめ

- 補足の情報は、設定と深さで出すかを決めると、出力の量を制御できる。
- 外部の処理が失敗しうるときは、保護された呼び出しで包むと、全体の動きが安定する。
- 文字列を埋め込むときは、閉じ記号が混ざる可能性を意識しておく。
