---
title: 「読み飛ばす文字」を 1 文字ずつ探す、JSON 解析の next_char
description: JSON ライブラリ json.lua の解析で使われる next_char。文字の集合を見ながら、次に意味のある文字の位置を探します。空白を飛ばす処理もこの 1 関数で済ませています。
language: lua
project: json.lua
repo: https://github.com/rxi/json.lua
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "dbf4b2dd2eb7c23be2773c89eb059dadd6436f94"
file: json.lua
lines: [165, 172]
format: 2
function: next_char
difficulty: 1
tags: [パース, 文字列処理, イディオム]
---

## ひとことで

`next_char(str, idx, set, negate)` は、文字列の `idx` 番目から見て、`set` に入っている文字が最初に現れる位置を返す関数です。`negate` を `true` にすると逆に「`set` に入っていない最初の文字」を探します。JSON を読むときに、空白を飛ばしたり、値の終わりを見つけたりするのに使われています。

## コード

```lua:line-numbers=165
local function next_char(str, idx, set, negate)
  for i = idx, #str do
    if set[str:sub(i, i)] ~= negate then
      return i
    end
  end
  return #str + 1
end
```

## 前提知識

- **集合（set）**: 「この文字は含まれるか」を調べるための表です。`set[文字]` が `true` なら含まれ、`nil` なら含まれません。json.lua では `create_set` でこの表を作っています。
- **`negate`（否定）**: 真偽値を反転させるための引数です。ここでは「集合に含まれるか」を「含まれないか」に切り替えるために使います。
- **`~=`**: Lua の「等しくない」の演算子です。`a ~= b` は `a == b` の否定です。
- **`#str + 1`**: 文字列の長さに 1 を足した値で、文字列の最後の次の位置を指します。見つからなかったときに、「末尾まで読んだ」ことを表す値として使います。

## 何をしているか

### 1. 指定した位置から 1 文字ずつ見る

`for i = idx, #str do` で、`idx` から文字列の最後まで、1 文字ずつ位置 `i` を進めます。`str:sub(i, i)` で、その位置の 1 文字だけを取り出します。

```lua:line-numbers=166
  for i = idx, #str do
    if set[str:sub(i, i)] ~= negate then
```

### 2. 集合の判定と `negate` を比べる

`set[文字]` は、含まれるなら `true`、含まれないなら `nil` になります。`negate` を省略すると `nil` が入るので、条件は `set[文字] ~= nil` となり、「集合に含まれる文字」が見つかった時点で止まります。`nil` と `false` は別物なので注意してください。

`negate` に `true` を渡すと、条件は `set[文字] ~= true` になります。含まれる文字は `true ~= true` で偽になって飛ばされ、含まれない文字（`nil`）は `nil ~= true` で真になるので、「集合にない最初の文字」が見つかります。JSON では、空白を飛ばしたいときに `space_chars` と `true` を組み合わせて使っています。

```lua:line-numbers=154
local delim_chars   = create_set(" ", "\t", "\r", "\n", "]", "}", ",")
```

数字や単語を読むときは `delim_chars`（区切り文字）を `negate` なしで渡し、「次の区切りまで」を探します。空白を飛ばすときは `space_chars` を `true` と一緒に渡し、「空白でない最初の文字」を探します。同じ関数が、引数の違いだけで 2 通りの役割をこなしています。

```lua:line-numbers=286
    i = next_char(str, i, space_chars, true)
```

### 3. 見つからなければ末尾の次を返す

ループで見つからなかった場合は、`#str + 1` を返します。これは「文字列の終わりまで、探す文字がなかった」ことを表します。呼び出し側は `str:sub(i, i)` が空文字になるので、その後の判定で「終わり」として扱えます。

```lua:line-numbers=171
  return #str + 1
```

## ここがすごい

- **1 つの関数で「探す」と「飛ばす」を両方こなす**: `negate` を切り替えるだけで、「区切り文字を探す」「空白を飛ばす」の 2 つの用途に対応できます。関数を 2 つ書く必要がありません。
- **集合の表と組み合わせる**: 判定が `set[c]` の 1 回の参照で済むので、何文字の候補があっても速く動きます。`create_set` で作った表をそのまま使える設計になっています。
- **末尾を特別扱いしない工夫**: 見つからないとき `#str + 1` を返すと、`str:sub` が空文字を返すだけで、範囲外の参照による異常が起きません。
- **トレードオフ**: 文字列を 1 文字ずつ `sub` で切り出すので、長い JSON では時間がかかります。ただし、解析の正しさを優先した読みやすい書き方です。

## まとめ

- 「含まれる」と「含まれない」の 2 つの探し方は、真偽値 1 つで切り替えられる。
- 集合の表と組み合わせると、空白飛ばしや区切り探しを 1 つの関数で書ける。
- 見つからないときの戻り値を「末尾の次」にすると、呼び出し側が簡単になる。
