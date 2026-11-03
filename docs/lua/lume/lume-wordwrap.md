---
title: 単語の途中で割らずに折り返す、wordwrap の空白の扱い
description: Lua の小さなユーティリティ集 lume の wordwrap。単語と空白を 1 組ずつ取り出し、長さの上限を超えるたびに改行を入れます。もとの改行や空白は消さずに残します。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [618, 647]
format: 2
function: lume.wordwrap
difficulty: 2
tags: [文字列処理, アルゴリズム, イテレータ]
---

## ひとことで

`lume.wordwrap(str, limit)` は、長い文章を指定した文字数の手前で改行し、単語の途中では割らない関数です。もとの文章にあった改行や空白も、できるだけそのまま残します。ヘルプ文や、ゲームのメッセージ欄に文章を収めるときに使えます。

## コード

```lua:line-numbers=618
function lume.wordwrap(str, limit)
  limit = limit or 72
  local check
  if type(limit) == "number" then
    check = function(s) return #s >= limit end
  else
    check = limit
  end
  local rtn = {}
  local line = ""
  for word, spaces in str:gmatch("(%S+)(%s*)") do
    local s = line .. word
    if check(s) then
      table.insert(rtn, line .. "\n")
      line = word
    else
      line = s
    end
    for c in spaces:gmatch(".") do
      if c == "\n" then
        table.insert(rtn, line .. "\n")
        line = ""
      else
        line = line .. c
      end
    end
  end
  table.insert(rtn, line)
  return table.concat(rtn)
end
```

## 前提知識

- **パターン `%S` と `%s`**: `%S` は空白以外の 1 文字、`%s` は空白（スペース・タブ・改行など）の 1 文字を表す Lua のパターンです。大文字は「それ以外」という意味になります。
- **`gmatch`**: パターンに合う部分を、先頭から順番に次々と取り出すイテレータを返します。`for word, spaces in str:gmatch(...)` の形で使います。
- **`table.insert` と `table.concat`**: `insert` は配列の末尾に値を追加し、`concat` は配列の値をすべてつなげて 1 つの文字列にします。文字列を何度もつなぐより速く動くので、結果を集めるときによく使われます。
- **`limit` が関数の場合**: `limit` は数字でなく、判定の関数を渡すこともできます。関数版の `check` は、その関数をそのまま使います。

## 何をしているか

### 1. 「単語」と「後ろの空白」を組にして取り出す

パターン `(%S+)(%s*)` は、単語の部分と、その後ろに続く空白の部分の 2 つを 1 組として取り出します。空白も一緒に取るので、もとの文章の空白を後で正確に再現できます。

```lua:line-numbers=628
  for word, spaces in str:gmatch("(%S+)(%s*)") do
```

### 2. 行に足すと長すぎるなら改行する

まず `line .. word` で、今の行に単語を足した文字列 `s` を作ります。`check(s)` が真なら、今の行をそこで終わらせて（`"\n"` を付けて）、単語を次の行の先頭にします。そうでなければ、そのまま `s` を今の行とします。

```lua:line-numbers=629
    local s = line .. word
```

```lua:line-numbers=630
    if check(s) then
```

```lua:line-numbers=631
      table.insert(rtn, line .. "\n")
```

```lua:line-numbers=632
      line = word
```

### 3. 後ろの空白を 1 文字ずつ写す

空白が `"\n"` なら、そこで行を終わらせます。それ以外の空白（スペース）は、そのまま今の行に足します。これで、もとの文章に改行があった位置は、折り返し後も改行として残ります。

```lua:line-numbers=636
    for c in spaces:gmatch(".") do
      if c == "\n" then
        table.insert(rtn, line .. "\n")
        line = ""
      else
        line = line .. c
      end
    end
```

`"hello world\n\nbye"` を `limit` 8 で処理すると、`"hello"` と `" "` のあと、`"world"` を足すと 11 文字になるので改行されます。このように、文字数の判定と、もとの改行の再現を別々に行います。

### 4. 最後の行を足して返す

ループが終わったあとに残っている `line` を配列に入れ、`table.concat` で 1 つの文字列にして返します。

```lua:line-numbers=645
  table.insert(rtn, line)
  return table.concat(rtn)
```

## ここがすごい

- **単語の途中で割らない**: 文字数だけで機械的に切ると、`wonderful` が `wonder` と `ful` に割れてしまいます。単語を 1 つのまとまりとして扱うので、読みやすさが保たれます。
- **空白を捨てない設計**: 空白を `(%s*)` で一緒に取ることで、もとの改行の位置を正確に再現できます。空白を単純に `" "` へ置き換える実装だと、段落の区切りが消えてしまいます。
- **判定を差し替えられる**: `limit` に関数を渡せるので、文字数ではなく「見た目の幅」などを判定に使えます。判定と折り返しの仕組みを分けたからこそできる工夫です。
- **注意点**: 文字数は Lua の `#` で数えるので、バイト数です。日本語のような多バイト文字は、実際の表示幅とずれます。

## まとめ

- 単語と空白を組で取り出すと、折り返しと改行の再現を 1 つのループで行える。
- 判定を関数として差し替え可能にすると、文字数以外の基準にも使える。
- 結果は配列に集めて最後に `table.concat` でつなぐと、効率よく文字列を作れる。
