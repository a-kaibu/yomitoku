---
title: 上位と下位に分かれた \u の 2 つの数を、1 つの文字に合わせる
description: JSON ライブラリ json.lua の parse_unicode_escape。\uXXXX の 16 進数を読み、2 つ並んだ場合は、サロゲートペアとして 1 つの Unicode 文字にまとめ直します。
language: lua
project: json.lua
repo: https://github.com/rxi/json.lua
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "dbf4b2dd2eb7c23be2773c89eb059dadd6436f94"
file: json.lua
lines: [206, 215]
format: 2
function: parse_unicode_escape
difficulty: 3
tags: [文字列処理, Unicode, パース]
---

## ひとことで

`parse_unicode_escape(s)` は、JSON の `\u` の後に続く 16 進数の文字列を読み、対応する UTF-8 の文字に変える関数です。BMP の外の文字は、JSON では 2 つの `\u` を並べて書くため、そのときは 2 つをまとめて 1 文字にします。

## コード

::: code-group

```lua:line-numbers=206 [日本語訳]
local function parse_unicode_escape(s)
  local n1 = tonumber( s:sub(1, 4),  16 )
  local n2 = tonumber( s:sub(7, 10), 16 )
   -- サロゲートペアか？
  if n2 then
    return codepoint_to_utf8((n1 - 0xd800) * 0x400 + (n2 - 0xdc00) + 0x10000)
  else
    return codepoint_to_utf8(n1)
  end
end
```

```lua:line-numbers=206 [原文]
local function parse_unicode_escape(s)
  local n1 = tonumber( s:sub(1, 4),  16 )
  local n2 = tonumber( s:sub(7, 10), 16 )
   -- Surrogate pair?
  if n2 then
    return codepoint_to_utf8((n1 - 0xd800) * 0x400 + (n2 - 0xdc00) + 0x10000)
  else
    return codepoint_to_utf8(n1)
  end
end
```

:::

上の関数の中で使われる、変換の関数 `codepoint_to_utf8` は、次の通りです。

```lua:line-numbers=189
local function codepoint_to_utf8(n)
  -- http://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=iws-appendixa
  local f = math.floor
  if n <= 0x7f then
    return string.char(n)
  elseif n <= 0x7ff then
    return string.char(f(n / 64) + 192, n % 64 + 128)
  elseif n <= 0xffff then
    return string.char(f(n / 4096) + 224, f(n % 4096 / 64) + 128, n % 64 + 128)
  elseif n <= 0x10ffff then
    return string.char(f(n / 262144) + 240, f(n % 262144 / 4096) + 128,
                       f(n % 4096 / 64) + 128, n % 64 + 128)
  end
  error( string.format("invalid unicode codepoint '%x'", n) )
end
```

## 前提知識

- **Unicode のコードポイント**: 文字 1 つひとつに振られた番号です。`U+3042` のように表します。
- **サロゲートペア**: 16 ビットに収まらない文字を、2 つの 16 ビットの値で表す仕組みです。前の値は `D800` から `DBFF`、後ろの値は `DC00` から `DFFF` の範囲になります。
- **UTF-8**: 1 文字を 1〜4 バイトで表す文字コードです。`codepoint_to_utf8` がその形に変えます。
- **`tonumber(s, 16)`**: 16 進数の文字列を数に変える標準関数です。

## 何をしているか

### 1. 2 つの 16 進数を読む

`s:sub(1, 4)` は 1 つ目の 4 桁、`s:sub(7, 10)` は `\u` を挟んだ 2 つ目の 4 桁です。2 つ目が読めなければ `n2` は `nil` になり、1 つだけの文字として扱われます。

```lua:line-numbers=207
  local n1 = tonumber( s:sub(1, 4),  16 )
  local n2 = tonumber( s:sub(7, 10), 16 )
```

### 2. サロゲートペアなら 1 つの番号に計算し直す

`n2` があれば、サロゲートの決まりに従って、`(n1 - 0xd800) * 0x400 + (n2 - 0xdc00) + 0x10000` を計算します。前の値の下 10 ビットと、後ろの値の下 10 ビットを合わせて、本来のコードポイントにしています。

```lua:line-numbers=211
    return codepoint_to_utf8((n1 - 0xd800) * 0x400 + (n2 - 0xdc00) + 0x10000)
```

### 3. 1 つだけなら、そのまま UTF-8 にする

`n2` がなければ、`n1` をそのまま `codepoint_to_utf8` に渡します。

```lua:line-numbers=213
    return codepoint_to_utf8(n1)
```

### 4. 範囲ごとにバイト数を変える

`codepoint_to_utf8` は、番号の大きさで 1 から 4 バイトに分けて作ります。`0x7f` 以下なら 1 バイトで、それ以上は続きのバイトの数が増えます。

## ここがすごい

- **2 つの値を 1 つに戻す計算**: サロゲートペアの決まりを、加減算と乗算だけで書いています。表を使わずに、本来の文字に戻せます。
- **1 つ目の値だけでも動く**: `n2` の有無で分岐するので、通常の文字と、2 つで表す文字を、同じ関数で扱えます。
- **注意点**: 片方だけの `\u` が来て、もう片方の値が範囲外のとき、計算の結果が不正な番号になることがあります。`codepoint_to_utf8` が範囲外を検出してエラーにするので、その場合は解析が止まります。

## まとめ

- サロゲートペアは、2 つの 16 ビットの値から計算で元のコードポイントに戻せる。
- 文字の範囲で UTF-8 のバイト数が変わるので、範囲ごとに分けて作る。
