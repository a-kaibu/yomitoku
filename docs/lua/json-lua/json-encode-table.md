---
title: 表を配列かオブジェクトに分けて JSON にする encode_table
description: Lua の JSON ライブラリ rxi/json.lua の encode_table。表の形を見て、配列かオブジェクトかを決めて文字列にします。循環参照や穴のある配列は、エラーにして弾きます。
language: lua
project: json.lua
repo: https://github.com/rxi/json.lua
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "dbf4b2dd2eb7c23be2773c89eb059dadd6436f94"
file: json.lua
lines: [59, 98]
format: 2
function: encode_table
difficulty: 3
tags: [再帰, パース, 防御的プログラミング]
---
## ひとことで

`encode_table(val, stack)` は、Lua の表を JSON の配列か、オブジェクトのどちらかの文字列にする関数です。表の先頭が配列の形をしているかで、どちらの形にするかを選びます。さらに、循環参照や穴のある配列を見つけて、エラーにします。

## コード

:::: code-group

```lua:line-numbers=59 [日本語訳]
local function encode_table(val, stack)
  local res = {}
  stack = stack or {}

  -- 循環参照か？
  if stack[val] then error("circular reference") end

  stack[val] = true

  if rawget(val, 1) ~= nil or next(val) == nil then
    -- 配列として扱う。鍵が正しく、穴がないかを確かめる
    local n = 0
    for k in pairs(val) do
      if type(k) ~= "number" then
        error("invalid table: mixed or invalid key types")
      end
      n = n + 1
    end
    if n ~= #val then
      error("invalid table: sparse array")
    end
    -- 符号化する
    for i, v in ipairs(val) do
      table.insert(res, encode(v, stack))
    end
    stack[val] = nil
    return "[" .. table.concat(res, ",") .. "]"

  else
    -- オブジェクトとして扱う
    for k, v in pairs(val) do
      if type(k) ~= "string" then
        error("invalid table: mixed or invalid key types")
      end
      table.insert(res, encode(k, stack) .. ":" .. encode(v, stack))
    end
    stack[val] = nil
    return "{" .. table.concat(res, ",") .. "}"
  end
end
```

```lua:line-numbers=59 [原文]
local function encode_table(val, stack)
  local res = {}
  stack = stack or {}

  -- Circular reference?
  if stack[val] then error("circular reference") end

  stack[val] = true

  if rawget(val, 1) ~= nil or next(val) == nil then
    -- Treat as array -- check keys are valid and it is not sparse
    local n = 0
    for k in pairs(val) do
      if type(k) ~= "number" then
        error("invalid table: mixed or invalid key types")
      end
      n = n + 1
    end
    if n ~= #val then
      error("invalid table: sparse array")
    end
    -- Encode
    for i, v in ipairs(val) do
      table.insert(res, encode(v, stack))
    end
    stack[val] = nil
    return "[" .. table.concat(res, ",") .. "]"

  else
    -- Treat as an object
    for k, v in pairs(val) do
      if type(k) ~= "string" then
        error("invalid table: mixed or invalid key types")
      end
      table.insert(res, encode(k, stack) .. ":" .. encode(v, stack))
    end
    stack[val] = nil
    return "{" .. table.concat(res, ",") .. "}"
  end
end
```

::::

## 前提知識

- **`stack`**: 今たどっている表を覚えておく表です。同じ表が再び出てきたら、循環しているとみなします。
- **`rawget(val, 1)`**: メタテーブルを無視して、番号 `1` の値を取り出す関数です。配列かどうかを判定するために使います。
- **`next(val) == nil`**: 表が空かどうかを調べる書き方です。空の表は、配列として `[]` と書きます。
- **穴のある配列**: 番号が途切れている表のことです。JSON の配列として正しく書けないので、ここでは弾きます。

## 何をしているか

### 1. 循環していないかを確かめる

`stack[val]` が真なら、この表はすでにたどっている途中です。循環参照としてエラーにします。その後、この表を「たどっている」印として覚えます。

```lua:line-numbers=64
  if stack[val] then error("circular reference") end

  stack[val] = true
```

### 2. 配列の形なら、鍵が正しいかを確かめる

番号 `1` がある表、または空の表を、配列として扱います。鍵がすべて数であり、個数が長さと一致するかを確かめます。一致しなければ、穴があるのでエラーです。

```lua:line-numbers=70
    local n = 0
    for k in pairs(val) do
      if type(k) ~= "number" then
        error("invalid table: mixed or invalid key types")
      end
      n = n + 1
    end
    if n ~= #val then
      error("invalid table: sparse array")
    end
```

### 3. 配列を並べて、角括弧で囲む

`ipairs` で順に要素を符号化し、`table.concat` で `,` でつないで、`[` と `]` で囲みます。

```lua:line-numbers=81
    for i, v in ipairs(val) do
      table.insert(res, encode(v, stack))
    end
    stack[val] = nil
    return "[" .. table.concat(res, ",") .. "]"
```

### 4. それ以外はオブジェクトとして並べる

配列でなければ、鍵が文字列であることを確かめます。そして、鍵と値の組を `"鍵":値` の形にして、`{` と `}` で囲みます。

```lua:line-numbers=89
    for k, v in pairs(val) do
      if type(k) ~= "string" then
        error("invalid table: mixed or invalid key types")
      end
      table.insert(res, encode(k, stack) .. ":" .. encode(v, stack))
    end
    stack[val] = nil
    return "{" .. table.concat(res, ",") .. "}"
```

## ここがすごい

- **形を見て出力を選ぶ**: 同じ表でも、番号があれば配列、文字の鍵ならオブジェクトとして出力されます。利用者が形式を指定する必要がありません。
- **不正な表を先に弾く**: 循環や穴、混ざった鍵の種類は、出力を作る前に見つけます。壊れた JSON が出力されることを防ぎます。
- **覚え書きを必ず消す**: `stack[val]` は、処理の後で `nil` に戻されます。同じ表を二度別の場所で使っても、誤って循環と判定されません。
- **注意点**: 空の表は、常に配列 `[]` になります。空のオブジェクトを出したい場合は、別の目印が必要です。

## まとめ

- 形式が決まっていないデータは、中の形を見て出力を分けると、利用者の手間を減らせる。
- 出力の前に不正な形を弾くと、壊れた結果を外に出さずに済む。
- 循環を調べるときは、たどっている途中の印を付けて、終わったら消すと、正しく判定できる。
